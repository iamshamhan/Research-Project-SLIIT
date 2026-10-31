# Doctor to patient — feature branch

Open `/doctor` or select **Doctor → Patient** in the navigation. The existing patient camera page remains at `/`.

Type in either large language box. After a 900 ms typing pause the other box translates automatically. Writing in the translated box makes that language the source; updates do not trigger translation loops. Writing-language buttons start a fresh message. Clear removes both texts. Requests are cancelled on further edits; old responses cannot overwrite a newer message.

This page uses the online MyMemory REST API through the local FastAPI endpoint `POST /translate/online` (`text`, `source: en|si`). No translation models or API credentials are required. Internet access is required; the external provider has availability, quality and daily-quota limitations. Each message is limited to 500 UTF-8 bytes as specified at https://mymemory.translated.net/doc/spec.php (Sinhala characters generally require more than one byte). The UI shows the count and asks for a shorter message when exceeded. Errors and retry are explicit.

Only the new doctor page uses this online endpoint. The pre-existing patient-to-doctor English preview continues using its existing limited offline glossary. Sign recognition is unchanged and still awaits its model.

Typed text is sent to an external service, as disclosed on the page. No messages are persisted by this implementation. Use demo/non-identifying text; this is not a clinically validated translator.

Restart the local app to load the new backend route. Run `python -m unittest test_pipeline test_online_translation` from the backend environment, and `npm test` / `npm run build` in frontend.

Work is isolated on `feature/doctor-to-patient`; it is not merged into main.
