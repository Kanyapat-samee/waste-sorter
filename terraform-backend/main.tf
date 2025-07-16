# ---------------------------------------------
# AWS Provider
# ---------------------------------------------
provider "aws" {
  region = "ap-southeast-1"
}

# ---------------------------------------------
# SSH Key สำหรับเข้า EC2
# ---------------------------------------------
resource "aws_key_pair" "default" {
  key_name   = "waste-key"
  public_key = file("~/.ssh/waste-key.pub")
}

# ---------------------------------------------
# Security Group สำหรับ EC2
# ---------------------------------------------
resource "aws_security_group" "ec2_sg" {
  name_prefix = "waste-allow"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # สำหรับ SSH
  }

  ingress {
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ---------------------------------------------
# EC2 Instance + Docker + Backend Container
# ---------------------------------------------
resource "aws_instance" "waste_ec2" {
  ami                    = "ami-0e7f9c9fced6cfb10"
  instance_type          = "t2.micro"
  key_name               = aws_key_pair.default.key_name
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]

  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              yum install -y docker git
              systemctl start docker
              systemctl enable docker
              usermod -aG docker ec2-user
              docker pull your-dockerhub-username/your-image-name
              docker run -d -p 5000:5000 your-dockerhub-username/your-image-name
              EOF

  tags = {
    Name = "WasteSorterEC2"
  }
}

# ---------------------------------------------
# Elastic IP สำหรับ EC2
# ---------------------------------------------
resource "aws_eip" "static_ip" {
  instance = aws_instance.waste_ec2.id
}

# ---------------------------------------------
# API Gateway (Proxy ไปยัง EC2)
# ---------------------------------------------
resource "aws_apigatewayv2_api" "classify_api" {
  name          = "ClassifyAPI"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["POST", "OPTIONS"]
    allow_headers = ["Content-Type"]
  }
}

resource "aws_apigatewayv2_integration" "classify_proxy" {
  api_id                 = aws_apigatewayv2_api.classify_api.id
  integration_type       = "HTTP_PROXY"
  integration_uri        = "http://${aws_eip.static_ip.public_ip}:5000/classify"
  integration_method     = "POST"
  payload_format_version = "1.0"
}

resource "aws_apigatewayv2_route" "classify_route" {
  api_id    = aws_apigatewayv2_api.classify_api.id
  route_key = "POST /classify"
  target    = "integrations/${aws_apigatewayv2_integration.classify_proxy.id}"
}

resource "aws_apigatewayv2_stage" "classify_stage" {
  api_id      = aws_apigatewayv2_api.classify_api.id
  name        = "$default"
  auto_deploy = true
}