# @dottedice/x509-asn1-builder

Zero-dependency ASN.1 DER (Distinguished Encoding Rules) serializer for JavaScript, Web Cryptography API, and X.509 certificate packaging.

## Installation

```bash
npm install @dottedice/x509-asn1-builder
```

## Features
* **Zero Dependencies**: Pure vanilla JavaScript module.
* **DER Primitive Encoding**: Serializes Sequence, Set, Integer, OID, BitString, OctetString, UTCTime, PrintableString, and UTF8String.
* **X.509 Struct Generation**: Standard compliant TLV (Tag-Length-Value) generators for `TBSCertificate` (RFC 5280) and raw DER certificate construction.

## API Reference

### Primitive DER Encoders
* `derInteger(value)`: Encodes numeric values or big serial hex strings.
* `derOID(oidStr)`: Encodes string OIDs (e.g. `1.2.840.113549.1.1.11`).
* `derUTCTime(date)`: Formats Date objects to `YYMMDDHHMMSSZ` format.
* `derSequence(arrays)` / `derSet(arrays)`: Encodes nested structures.

### X.509 Builders
* `buildName(attributes)`: Generates Name directory entries (e.g. commonName, organization).
* `buildTBSCertificate(options)`: Generates To-Be-Signed Certificate payload structure.
* `buildX509Certificate(tbsDer, signatureAlgorithmOid, signatureBytes)`: Wraps TBS payload and computed signature into valid X.509 DER format.
