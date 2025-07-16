# -----------------------------
#         Output URLs
# -----------------------------
output "frontend_https_url" {
  value       = "https://${aws_cloudfront_distribution.frontend_cdn.domain_name}"
  description = "Frontend URL via CloudFront + HTTPS"
}

output "feedback_api_url" {
  value = aws_apigatewayv2_api.feedback_api.api_endpoint
}