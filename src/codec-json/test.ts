import { JsonEncoded, jsonEncode } from ".";
import { staticTest } from "../static-test.js";

staticTest(() => {
  {
    const x: JsonEncoded<string> = jsonEncode("");
  }

  {
    // @ts-expect-error
    const x: JsonEncoded<{ a: string; b: number }> = jsonEncode({});
  }

  {
    const x: JsonEncoded<{ a: string; b: number }> = jsonEncode({
      a: "",
      b: 1,
    });
  }
});
