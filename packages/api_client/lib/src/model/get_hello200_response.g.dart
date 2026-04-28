// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'get_hello200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$GetHello200Response extends GetHello200Response {
  @override
  final HelloResponseDto data;
  @override
  final BuiltMap<String, JsonObject?> meta;
  @override
  final String requestId;

  factory _$GetHello200Response(
          [void Function(GetHello200ResponseBuilder)? updates]) =>
      (GetHello200ResponseBuilder()..update(updates))._build();

  _$GetHello200Response._(
      {required this.data, required this.meta, required this.requestId})
      : super._();
  @override
  GetHello200Response rebuild(
          void Function(GetHello200ResponseBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  GetHello200ResponseBuilder toBuilder() =>
      GetHello200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is GetHello200Response &&
        data == other.data &&
        meta == other.meta &&
        requestId == other.requestId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, data.hashCode);
    _$hash = $jc(_$hash, meta.hashCode);
    _$hash = $jc(_$hash, requestId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'GetHello200Response')
          ..add('data', data)
          ..add('meta', meta)
          ..add('requestId', requestId))
        .toString();
  }
}

class GetHello200ResponseBuilder
    implements Builder<GetHello200Response, GetHello200ResponseBuilder> {
  _$GetHello200Response? _$v;

  HelloResponseDtoBuilder? _data;
  HelloResponseDtoBuilder get data =>
      _$this._data ??= HelloResponseDtoBuilder();
  set data(HelloResponseDtoBuilder? data) => _$this._data = data;

  MapBuilder<String, JsonObject?>? _meta;
  MapBuilder<String, JsonObject?> get meta =>
      _$this._meta ??= MapBuilder<String, JsonObject?>();
  set meta(MapBuilder<String, JsonObject?>? meta) => _$this._meta = meta;

  String? _requestId;
  String? get requestId => _$this._requestId;
  set requestId(String? requestId) => _$this._requestId = requestId;

  GetHello200ResponseBuilder() {
    GetHello200Response._defaults(this);
  }

  GetHello200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _data = $v.data.toBuilder();
      _meta = $v.meta.toBuilder();
      _requestId = $v.requestId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(GetHello200Response other) {
    _$v = other as _$GetHello200Response;
  }

  @override
  void update(void Function(GetHello200ResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  GetHello200Response build() => _build();

  _$GetHello200Response _build() {
    _$GetHello200Response _$result;
    try {
      _$result = _$v ??
          _$GetHello200Response._(
            data: data.build(),
            meta: meta.build(),
            requestId: BuiltValueNullFieldError.checkNotNull(
                requestId, r'GetHello200Response', 'requestId'),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
        _$failedField = 'meta';
        meta.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'GetHello200Response', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
