//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:api_client/src/model/hello_response_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'get_hello200_response.g.dart';

/// GetHello200Response
///
/// Properties:
/// * [data] 
/// * [meta] - Response metadata (pagination, counts, etc.)
/// * [requestId] - Correlation ID for tracing
@BuiltValue()
abstract class GetHello200Response implements Built<GetHello200Response, GetHello200ResponseBuilder> {
  @BuiltValueField(wireName: r'data')
  HelloResponseDto get data;

  /// Response metadata (pagination, counts, etc.)
  @BuiltValueField(wireName: r'meta')
  BuiltMap<String, JsonObject?> get meta;

  /// Correlation ID for tracing
  @BuiltValueField(wireName: r'requestId')
  String get requestId;

  GetHello200Response._();

  factory GetHello200Response([void updates(GetHello200ResponseBuilder b)]) = _$GetHello200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(GetHello200ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<GetHello200Response> get serializer => _$GetHello200ResponseSerializer();
}

class _$GetHello200ResponseSerializer implements PrimitiveSerializer<GetHello200Response> {
  @override
  final Iterable<Type> types = const [GetHello200Response, _$GetHello200Response];

  @override
  final String wireName = r'GetHello200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    GetHello200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(HelloResponseDto),
    );
    yield r'meta';
    yield serializers.serialize(
      object.meta,
      specifiedType: const FullType(BuiltMap, [FullType(String), FullType.nullable(JsonObject)]),
    );
    yield r'requestId';
    yield serializers.serialize(
      object.requestId,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    GetHello200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required GetHello200ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(HelloResponseDto),
          ) as HelloResponseDto;
          result.data.replace(valueDes);
          break;
        case r'meta':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltMap, [FullType(String), FullType.nullable(JsonObject)]),
          ) as BuiltMap<String, JsonObject?>;
          result.meta.replace(valueDes);
          break;
        case r'requestId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.requestId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  GetHello200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = GetHello200ResponseBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

