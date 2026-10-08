import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import io.github.jamsesso.jsonlogic.JsonLogic;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Runs json-logic-java (the library of the IASO app) on cases.tsv and prints the results as the JSON fixture used by
 * iaso/tests/scenarios/test_jsonlogic.py.
 *
 * Each case is "logic<TAB>data", data being "key=type:value;key2=type:value" with the types the app feeds to
 * json-logic-java (GetFormStructure / List<Question>.data): int, long, double, bool, str, list (comma separated), null.
 *
 * Regenerate (json-logic-java 1.1.0 + gson 2.8.5 jars from Maven Central):
 *   javac -cp "$CP" -d /tmp/probe Probe.java
 *   grep -v '^#' cases.tsv | grep -v '^$' | java -cp "$CP:/tmp/probe" Probe > json_logic_java_1_1_0.json
 */
public class Probe {
    public static void main(String[] args) throws Exception {
        JsonLogic jsonLogic = new JsonLogic();
        Gson gson = new GsonBuilder().serializeNulls().disableHtmlEscaping().setPrettyPrinting().create();
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in, "UTF-8"));
        List<Map<String, Object>> cases = new ArrayList<>();
        String line;
        while ((line = in.readLine()) != null) {
            String[] parts = line.split("\t", -1);
            String spec = parts.length > 1 ? parts[1] : "";
            Map<String, Object> data = new LinkedHashMap<>();
            if (!spec.isEmpty()) {
                for (String kv : spec.split(";")) {
                    int eq = kv.indexOf('=');
                    String typed = kv.substring(eq + 1);
                    int colon = typed.indexOf(':');
                    String type = colon < 0 ? typed : typed.substring(0, colon);
                    String value = colon < 0 ? "" : typed.substring(colon + 1);
                    data.put(kv.substring(0, eq), convert(type, value));
                }
            }
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("logic", parts[0]);
            result.put("data", spec);
            try {
                Object value = jsonLogic.apply(parts[0], data);
                result.put("result", value);
                result.put("result_type", value == null ? null : value.getClass().getSimpleName());
                result.put("error", null);
            } catch (Throwable e) {
                result.put("result", null);
                result.put("result_type", null);
                result.put("error", e.getClass().getSimpleName());
            }
            cases.add(result);
        }
        System.out.println(gson.toJson(cases));
    }

    private static Object convert(String type, String value) {
        switch (type) {
            case "int": return Integer.valueOf(value);
            case "long": return Long.valueOf(value);
            case "double": return Double.valueOf(value);
            case "bool": return Boolean.valueOf(value);
            case "str": return value;
            case "list": return value.isEmpty() ? new ArrayList<>() : new ArrayList<>(Arrays.asList(value.split(",")));
            case "null": return null;
            default: throw new IllegalArgumentException("unknown type " + type);
        }
    }
}
