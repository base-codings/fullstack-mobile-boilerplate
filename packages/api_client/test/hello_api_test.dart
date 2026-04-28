import 'package:test/test.dart';
import 'package:api_client/api_client.dart';


/// tests for HelloApi
void main() {
  final instance = ApiClient().getHelloApi();

  group(HelloApi, () {
    // Returns a hello message with timestamp
    //
    //Future<GetHello200Response> getHello() async
    test('test getHello', () async {
      // TODO
    });

  });
}
