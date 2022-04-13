# @cloudy-ts/json-codec

Encode and decode JSON objects while maintaining the original type.

## Usage

```ts
import { jsonEncode, jsonDecode, JsonEncoded } from "@cloudy-ts/json-codec"

const detailsJson = jsonEncode({ name: "Codec", description: "JSON" })
// typeof detailsJson === JsonEncoded<{ name: string; description: string; }>
console.log(string) // '{"name":"Codec","description":"JSON"}'

const details = jsonDecode(detailsJson)
// typeof details === { name: string; description: string; }
```
