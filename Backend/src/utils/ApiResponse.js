/**
 * Standard API response helper.
 * All responses are wrapped in a consistent JSON envelope:
 * { success: boolean, message: string, data: any }
 *
 * This makes it easy for the frontend to always read `response.data`
 * and check `response.success` without defensive branching.
 */
class ApiResponse {
  /**
   * @param {number} statusCode  HTTP status code
   * @param {*}      data        Response payload (array, object, or null)
   * @param {string} message     Human-readable message
   */
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
  }

  /**
   * Send this response via an Express `res` object.
   * Always sends: { success, message, data }
   * For object payloads, also spreads keys at root for backward compat.
   *
   * @param {import('express').Response} res
   */
  send(res) {
    const isSuccess = this.statusCode < 400;

    // Object data — spread keys at root AND keep data field for RTK Query
    if (this.data !== null && typeof this.data === 'object' && !Array.isArray(this.data)) {
      return res.status(this.statusCode).json({
        success: isSuccess,
        message: this.message,
        data: this.data,
        ...this.data,    // spread for backward compat (pages using response.user, response.role, etc.)
      });
    }

    // Array or null/primitive — standard envelope
    return res.status(this.statusCode).json({
      success: isSuccess,
      message: this.message,
      data: this.data,
    });
  }
}

module.exports = ApiResponse;
