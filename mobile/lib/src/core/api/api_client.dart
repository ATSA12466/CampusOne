import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

/// Thrown for every failed API call with a user-safe message.
class ApiException implements Exception {
  ApiException(this.message, {this.status = 0, this.code});

  final String message;
  final int status;
  final String? code;

  bool get unauthorized => status == 401;
  bool get forbidden => status == 403;
  bool get notFound => status == 404;
  bool get conflict => status == 409;
  bool get gone => status == 410;
  bool get offline => status == 0;

  @override
  String toString() => message;
}

/// Minimal JSON client for the shared CampusOne backend.
class ApiClient {
  ApiClient({required String baseUrl, http.Client? httpClient})
    : baseUrl = baseUrl.endsWith('/')
          ? baseUrl.substring(0, baseUrl.length - 1)
          : baseUrl,
      _http = httpClient ?? http.Client();

  String baseUrl;
  final http.Client _http;
  String? _token;

  /// Every request fails closed after this long so an unreachable-but-
  /// unrefusing server cannot hang the UI forever.
  static const Duration timeout = Duration(seconds: 20);

  void setToken(String? token) => _token = token;

  /// Points the client at another backend (staging/prod switch).
  /// Release builds only accept https:// URLs so store builds can never
  /// depend on a developer machine, LAN IP, or dev server.
  void setBaseUrl(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) throw ApiException('Enter a server URL.');
    final uri = Uri.tryParse(trimmed);
    if (kReleaseMode && uri?.scheme != 'https') {
      throw ApiException('Release builds require an https:// server URL.');
    }
    if (uri == null || !(uri.scheme == 'http' || uri.scheme == 'https')) {
      throw ApiException('Enter a valid http(s) server URL.');
    }
    baseUrl = trimmed.endsWith('/')
        ? trimmed.substring(0, trimmed.length - 1)
        : trimmed;
  }

  Map<String, String> get _headers {
    final headers = <String, String>{
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    final token = _token;
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Future<dynamic> get(String path, {Map<String, String>? query}) =>
      _send('GET', path, query: query);

  Future<dynamic> post(String path, {Object? body}) =>
      _send('POST', path, body: body);

  Future<dynamic> put(String path, {Object? body}) =>
      _send('PUT', path, body: body);

  Future<dynamic> patch(String path, {Object? body}) =>
      _send('PATCH', path, body: body);

  Future<dynamic> delete(String path, {Map<String, String>? query}) =>
      _send('DELETE', path, query: query);

  Future<dynamic> _send(
    String method,
    String path, {
    Map<String, String>? query,
    Object? body,
  }) async {
    final uri = Uri.parse('$baseUrl$path').replace(queryParameters: query);
    late http.Response response;
    try {
      final encoded = body == null ? null : jsonEncode(body);
      switch (method) {
        case 'GET':
          response = await _http.get(uri, headers: _headers).timeout(timeout);
        case 'POST':
          response =
              await _http.post(uri, headers: _headers, body: encoded).timeout(timeout);
        case 'PUT':
          response =
              await _http.put(uri, headers: _headers, body: encoded).timeout(timeout);
        case 'PATCH':
          response =
              await _http.patch(uri, headers: _headers, body: encoded).timeout(timeout);
        case 'DELETE':
          response = await _http.delete(uri, headers: _headers).timeout(timeout);
        default:
          throw ApiException('Unsupported request.');
      }
    } on SocketException {
      throw ApiException(
        "You're offline or CampusOne couldn't be reached. Please retry.",
      );
    } on TimeoutException {
      throw ApiException('The request timed out. Please retry.');
    } on http.ClientException {
      throw ApiException(
        "You're offline or CampusOne couldn't be reached. Please retry.",
      );
    }
    dynamic decoded;
    try {
      decoded = response.body.isEmpty ? null : jsonDecode(response.body);
    } catch (_) {
      decoded = null;
    }
    if (response.statusCode >= 200 && response.statusCode < 300) return decoded;
    final map = decoded is Map<String, dynamic> ? decoded : null;
    final message = map?['error'] is String
        ? map!['error'] as String
        : 'Something went wrong. Please retry.';
    final code = map?['code'] is String ? map!['code'] as String : null;
    throw ApiException(message, status: response.statusCode, code: code);
  }

  void close() => _http.close();
}
