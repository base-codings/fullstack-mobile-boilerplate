//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'hello_response_dto.g.dart';

/// HelloResponseDto
///
/// Properties:
/// * [message] - Greeting message from the API
/// * [timestamp] - ISO 8601 timestamp of when the response was generated
@BuiltValue()
abstract class HelloResponseDto implements Built<HelloResponseDto, HelloResponseDtoBuilder> {
  /// Greeting message from the API
  @BuiltValueField(wireName: r'message')
  String get message;

  /// ISO 8601 timestamp of when the response was generated
  @BuiltValueField(wireName: r'timestamp')
  String get timestamp;

  HelloResponseDto._();

  factory HelloResponseDto([void updates(HelloResponseDtoBuilder b)]) = _$HelloResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(HelloResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<HelloResponseDto> get serializer => _$HelloResponseDtoSerializer();
}

class _$HelloResponseDtoSerializer implements PrimitiveSerializer<HelloResponseDto> {
  @override
  final Iterable<Type> types = const [HelloResponseDto, _$HelloResponseDto];

  @override
  final String wireName = r'HelloResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    HelloResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'message';
    yield serializers.serialize(
      object.message,
      specifiedType: const FullType(String),
    );
    yield r'timestamp';
    yield serializers.serialize(
      object.timestamp,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    HelloResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required HelloResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'message':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.message = valueDes;
          break;
        case r'timestamp':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.timestamp = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  HelloResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = HelloResponseDtoBuilder();
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

