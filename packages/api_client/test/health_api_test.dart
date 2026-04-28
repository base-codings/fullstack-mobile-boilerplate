import 'package:test/test.dart';
import 'package:api_client/api_client.dart';


/// tests for HealthApi
void main() {
  final instance = ApiClient().getHealthApi();

  group(HealthApi, () {
    // Liveness health check
    //
    //Future getHealth() async
    test('test getHealth', () async {
      // TODO
    });

  });
}
