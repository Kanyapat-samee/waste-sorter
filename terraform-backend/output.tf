# ---------------------------------------------
#              Output URL ของ API
# ---------------------------------------------
output "classify_api_url" {
  value       = "${aws_apigatewayv2_api.classify_api.api_endpoint}/classify"
  description = "API endpoint to use as BACKEND_URL"
}