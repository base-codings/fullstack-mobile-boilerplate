// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'hello_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$HelloResponseDto extends HelloResponseDto {
  @override
  final String message;
  @override
  final String timestamp;

  factory _$HelloResponseDto(
          [void Function(HelloResponseDtoBuilder)? updates]) =>
      (HelloResponseDtoBuilder()..update(updates))._build();

  _$HelloResponseDto._({required this.message, required this.timestamp})
      : super._();
  @override
  HelloResponseDto rebuild(void Function(HelloResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  HelloResponseDtoBuilder toBuilder() =>
      HelloResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is HelloResponseDto &&
        message == other.message &&
        timestamp == other.timestamp;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, message.hashCode);
    _$hash = $jc(_$hash, timestamp.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'HelloResponseDto')
          ..add('message', message)
          ..add('timestamp', timestamp))
        .toString();
  }
}

class HelloResponseDtoBuilder
    implements Builder<HelloResponseDto, HelloResponseDtoBuilder> {
  _$HelloResponseDto? _$v;

  String? _message;
  String? get message => _$this._message;
  set message(String? message) => _$this._message = message;

  String? _timestamp;
  String? get timestamp => _$this._timestamp;
  set timestamp(String? timestamp) => _$this._timestamp = timestamp;

  HelloResponseDtoBuilder() {
    HelloResponseDto._defaults(this);
  }

  HelloResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _message = $v.message;
      _timestamp = $v.timestamp;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(HelloResponseDto other) {
    _$v = other as _$HelloResponseDto;
  }

  @override
  void update(void Function(HelloResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  HelloResponseDto build() => _build();

  _$HelloResponseDto _build() {
    final _$result = _$v ??
        _$HelloResponseDto._(
          message: BuiltValueNullFieldError.checkNotNull(
              message, r'HelloResponseDto', 'message'),
          timestamp: BuiltValueNullFieldError.checkNotNull(
              timestamp, r'HelloResponseDto', 'timestamp'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
