# api_client.api.HelloApi

## Load the API package
```dart
import 'package:api_client/api.dart';
```

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getHello**](HelloApi.md#gethello) | **GET** /hello | Returns a hello message with timestamp


# **getHello**
> GetHello200Response getHello()

Returns a hello message with timestamp

### Example
```dart
import 'package:api_client/api.dart';

final api = ApiClient().getHelloApi();

try {
    final response = api.getHello();
    print(response);
} on DioException catch (e) {
    print('Exception when calling HelloApi->getHello: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**GetHello200Response**](GetHello200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

