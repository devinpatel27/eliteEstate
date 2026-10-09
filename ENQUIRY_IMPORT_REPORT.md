# Enquiry import

Imported 177 enquiries from `ENQUIRYS.xlsx` into the user-specified Neon database on 9 October 2026. The database contained 7 leads before import and 184 afterward. All imported leads are unassigned.

Imported 111 rows from the RENT worksheet and 66 from BUY. Categories follow each row's INQUIRY FOR value, including BUY enquiries located on the RENT sheet. Sheet1 contains transactions with different headers and was excluded.

Only ENQUIRY DATE, NAME, MOBILE NUM, SOURCE FORM, INQUIRY FOR, and REQUIRMENT were mapped. Enquiry dates preserve midnight in India time. REQUIREMENT is the initial remark. No property, budget, assignee, or other workbook columns were imported. Standard CRM identifiers, creator, status, priority, and import fingerprints support valid records and repeat-safe import. International phone numbers retain their country codes.

Six incomplete rows were excluded pending correction:

| Worksheet | Excel row | Missing fields |
| --- | --- | --- |
| RENT | 113 | Source and category |
| BUY | 14 | Name |
| BUY | 16 | Name |
| BUY | 18 | Name |
| BUY | 19 | Name |
| BUY | 25 | Name |

The import runs in a transaction. A repeat run recognizes the existing import fingerprints and avoids reinserting those rows. Existing leads were preserved.
