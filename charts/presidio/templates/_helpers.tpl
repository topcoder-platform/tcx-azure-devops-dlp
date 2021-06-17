{{/* Generate certificates for custom-metrics api server */}}
{{- define "tcx-presidio.gen-certs" -}}
{{- $ca := genCA (.Values.caCommonName) 365 -}}
{{- $altNames := list (.Values.certDomainName) -}}
{{- $cert := genSignedCert (.Values.certDomainName) nil $altNames 365 $ca -}}
tls.crt: {{ $cert.Cert | b64enc }}
tls.key: {{ $cert.Key | b64enc }}
{{- end -}}
