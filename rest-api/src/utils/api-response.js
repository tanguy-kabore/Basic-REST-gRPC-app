// src/utils/api-response.js
class ApiResponse {
  constructor(statusCode, data, message = null) {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message || this.getDefaultMessage(statusCode);
    this.data = data;
  }
  getDefaultMessage(statusCode) {
    switch (statusCode) {
      case 200:
        return " OK ";
      case 201:
        return " Créé avec succès ";
      case 400:
        return " Requête incorrecte ";
      case 404:
        return " Ressource non trouvée ";
      case 500:
        return " Erreur serveur ";
      default:
        return " ";
    }
  }
  static success(data, message, statusCode = 200) {
    return new ApiResponse(statusCode, data, message);
  }
  static error(statusCode, message) {
    return new ApiResponse(statusCode, null, message);
  }
}
module.exports = ApiResponse;
