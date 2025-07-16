# -----------------------------
#        AWS Provider
# -----------------------------
provider "aws" {
  region = "ap-southeast-1"
}

# ----------------------------------
# ข้อมูล AWS Account (ใช้ใน S3 Policy)
# ----------------------------------
data "aws_caller_identity" "current" {}

# ------------------------------------
# เชื่อม backend state เพื่อดึง backend IP
# ------------------------------------
data "terraform_remote_state" "backend" {
  backend = "local"
  config = {
    path = "${path.module}/../terraform-backend/terraform.tfstate"
  }
}

# -------------------------
# DynamoDB สำหรับ Feedback
# -------------------------
resource "aws_dynamodb_table" "feedback_table" {
  name         = "waste-feedback"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }
}

# ---------------------------------
# IAM Role และ Policy สำหรับ Lambda
# ---------------------------------
resource "aws_iam_role" "lambda_role" {
  name = "lambda-feedback-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { Service = "lambda.amazonaws.com" },
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_policy_attachment" "lambda_basic_execution" {
  name       = "lambda-basic-attach"
  roles      = [aws_iam_role.lambda_role.name]
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_policy" "dynamodb_write_policy" {
  name = "dynamodb-feedback-write"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect   = "Allow",
      Action   = ["dynamodb:PutItem"],
      Resource = aws_dynamodb_table.feedback_table.arn
    }]
  })
}

resource "aws_iam_policy_attachment" "dynamodb_write_attach" {
  name       = "lambda-dynamodb-attach"
  roles      = [aws_iam_role.lambda_role.name]
  policy_arn = aws_iam_policy.dynamodb_write_policy.arn
}

# ---------------------------------
# Lambda Function สำหรับรับ Feedback
# ---------------------------------
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/lambda_payload.zip"
}

resource "aws_lambda_function" "feedback_handler" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "feedback-handler"
  role             = aws_iam_role.lambda_role.arn
  handler          = "feedback_handler.lambda_handler"
  runtime          = "python3.10"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  timeout          = 10
}

# ---------------------------------
# API Gateway (HTTPS) สำหรับ Lambda
# ---------------------------------
resource "aws_apigatewayv2_api" "feedback_api" {
  name          = "FeedbackAPI"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["POST", "OPTIONS"]
    allow_headers = ["Content-Type"]
  }
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id                 = aws_apigatewayv2_api.feedback_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.feedback_handler.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "feedback_route" {
  api_id    = aws_apigatewayv2_api.feedback_api.id
  route_key = "POST /feedback"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_stage" "default_stage" {
  api_id      = aws_apigatewayv2_api.feedback_api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "allow_apigw_invoke" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.feedback_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.feedback_api.execution_arn}/*/*"
}

# -----------------------------
#   S3 Bucket สำหรับ Frontend
# -----------------------------
resource "aws_s3_bucket" "frontend" {
  bucket        = "waste-sorting-frontend"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "frontend_access" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ----------------------------------------------
# Origin Access Identity (OAI) สำหรับ CloudFront
# ----------------------------------------------
resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "Frontend OAI"
}

# -----------------------------------
# CloudFront Distribution สำหรับ HTTPS
# -----------------------------------
resource "aws_cloudfront_distribution" "frontend_cdn" {
  origin {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id   = "s3-origin"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path

    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    target_origin_id       = "s3-origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    Name = "frontend-cdn"
  }
}

# ----------------------------------------
# Bucket Policy อนุญาตให้ CloudFront อ่าน S3
# ----------------------------------------
resource "aws_s3_bucket_policy" "frontend_policy" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Sid       = "AllowCloudFrontRead"
      Effect    = "Allow"
      Principal = {
        AWS = "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${aws_cloudfront_origin_access_identity.oai.id}"
      }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.frontend.arn}/*"
    }]
  })
}

# -----------------------------
#    สร้าง .env.production
# -----------------------------
resource "local_file" "frontend_env" {
  filename = "${path.module}/../waste-sorter/.env.production"
  content  = <<EOT
VITE_BACKEND_URL=${data.terraform_remote_state.backend.outputs.classify_api_url}
VITE_SUBMIT_FEEDBACK_URL=${aws_apigatewayv2_api.feedback_api.api_endpoint}/feedback
EOT
}

# -----------------------------
#   Build + Upload React App
# -----------------------------
resource "null_resource" "build_and_upload_frontend" {
  depends_on = [
    local_file.frontend_env,
    aws_s3_bucket.frontend
  ]

  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    working_dir = "${path.module}/../waste-sorter"
    command     = "npm install && npm run build"
  }

  provisioner "local-exec" {
    working_dir = "${path.module}/../waste-sorter"
    command     = "aws s3 sync dist s3://${aws_s3_bucket.frontend.id} --delete"
  }
}