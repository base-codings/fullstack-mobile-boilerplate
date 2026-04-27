import 'package:dio/dio.dart';
import 'package:mobile_boilerplate/core/error/app_exception.dart';
import 'package:mobile_boilerplate/features/hello/data/dto/hello_response_dto.dart';
import 'package:mobile_boilerplate/features/hello/domain/entities/hello_message.dart';
import 'package:mobile_boilerplate/features/hello/domain/repositories/hello_repository.dart';

/// Concrete implementation of [HelloRepository] using raw [Dio].
///
/// Phase 06 will replace the Dio call with the generated api_client from
/// `packages/api_client` (e.g. `HelloApi.getHello()`). The repository
/// interface and domain entity remain unchanged.
class HelloRepositoryImpl implements HelloRepository {
  const HelloRepositoryImpl(this._dio);

  final Dio _dio;

  @override
  Future<HelloMessage> getHello() async {
    try {
      // Backend response envelope: { data: { message, timestamp }, meta, requestId }
      final response = await _dio.get<Map<String, dynamic>>('/hello');

      final envelope = response.data;
      if (envelope == null) {
        throw const FormatException('Empty response body from /hello');
      }

      final dataMap = envelope['data'];
      if (dataMap is! Map<String, dynamic>) {
        throw const FormatException('Expected data object in /hello response');
      }

      final dto = HelloResponseDto.fromJson(dataMap);
      return _mapToEntity(dto);
    } on DioException catch (e) {
      // Translate Dio transport errors to domain Failure and re-throw
      // so the controller's AsyncValue.guard() captures them.
      throw mapDioToFailure(e);
    }
  }

  HelloMessage _mapToEntity(HelloResponseDto dto) => HelloMessage(
        message: dto.message,
        timestamp: DateTime.parse(dto.timestamp),
      );
}
