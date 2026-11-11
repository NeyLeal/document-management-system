---
name: auditar-contrato-api
description: Compara um endpoint do DMS com sua especificação, implementação em camadas e consumo no frontend.
argument-hint: endpoint ou fluxo (ex. POST /upload)
agent: code-reviewer
---

# Auditar contrato de API

Audite o endpoint ou fluxo `${input:fluxo:endpoint ou fluxo}` sem editar arquivos.

Leia `docs/specs/dms-spec.md` e rastreie o comportamento entre rota, controller,
service, repository e cliente `fetch` do frontend, conforme aplicável. Compare:

- Método, caminho, formato de entrada e status HTTP.
- Formato da resposta de sucesso e estrutura/códigos de erro.
- Validação de entrada, estados vazios e tratamento de falhas.
- Propriedade do documento e ausência de exposição de caminhos locais ou nomes internos.
- Uso exclusivo de `multer` com `diskStorage` e metadados em memória para documentos.

Apresente primeiro os problemas encontrados por severidade, com referências aos
arquivos e linhas. Depois liste lacunas de cobertura e pontos que correspondem à
especificação. Se não houver problemas, declare isso e indique os riscos que os
testes existentes não cobrem. Não implemente correções.
