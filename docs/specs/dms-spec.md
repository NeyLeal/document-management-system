# Especificação - Document Management System

> Especificação funcional e técnica do MVP, baseada em `spec-template.md`.
> O plano descreve etapas futuras; esta entrega cria somente este documento.

## 1. Objetivo

Permitir que usuários enviem, consultem e baixem seus documentos, mantendo os arquivos no filesystem local e os metadados em memória.

## 2. Escopo

### Dentro do escopo

- Enviar um arquivo por requisição.
- Listar os metadados dos documentos associados ao usuário atual.
- Baixar um documento pelo identificador, respeitando sua propriedade.
- Registrar o proprietário e os dados básicos de cada documento.
- Usar armazenamento local com `multer` e `diskStorage`; manter metadados em memória.
- Fornecer configuração por variáveis de ambiente e proxy do frontend para a API.

### Fora do escopo

- Armazenamento em nuvem, banco de dados ou provedores externos.
- Versionamento, edição, exclusão, compartilhamento e busca avançada.
- Cadastro, login e integração com provedor de identidade.
- Garantia de persistência dos metadados após reiniciar o processo.
- Suporte a múltiplos arquivos em um único upload.

## 3. Requisitos funcionais

| ID | Requisito | Critério de aceite |
| --- | --- | --- |
| RF-01 | Enviar documento | Recebe um arquivo no campo `file` via `multipart/form-data`, grava-o no armazenamento local e retorna os metadados criados. |
| RF-02 | Validar upload | Rejeita requisições sem arquivo ou com mais de um arquivo; erros de validação não deixam metadados nem arquivos órfãos. |
| RF-03 | Registrar metadados | Cada upload recebe identificador único, nome original, tamanho em bytes, data/hora ISO 8601 e proprietário. |
| RF-04 | Listar documentos | Retorna somente metadados dos documentos do usuário atual, sem expor caminhos ou nomes internos de armazenamento. |
| RF-05 | Baixar documento | Um usuário pode baixar um documento próprio por ID; o conteúdo é enviado como arquivo com nome original. |
| RF-06 | Isolar documentos | Documento inexistente ou pertencente a outro usuário não deve revelar sua existência; responder com `404`. |
| RF-07 | Verificar saúde | `GET /health` retorna o estado do processo, sem depender de chamadas a serviços externos. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Gravar arquivos exclusivamente no filesystem local da aplicação por `multer` com `diskStorage`; não usar armazenamento externo. |
| RNF-02 | Manter os metadados em memória nesta fase. Os arquivos sobrevivem ao reinício se o volume permanecer, mas os metadados não; documentar essa limitação. |
| RNF-03 | Configurar porta, diretório de armazenamento e limite de tamanho por variáveis de ambiente; definir e documentar os valores padrão antes da implementação. |
| RNF-04 | Gerar nome de armazenamento independente do nome enviado pelo usuário. Nunca usar o nome original para construir um caminho local. |
| RNF-05 | Não retornar caminho local, nome interno ou detalhes de erro não destinados ao cliente. |
| RNF-06 | Tratar erros de leitura/gravação e erros de upload sem derrubar o processo; limpar o arquivo gravado se o registro dos metadados falhar. |
| RNF-07 | Seguir Clean Architecture simples no backend: `routes -> controllers -> services -> repositories`. Camadas internas não dependem de Express ou de detalhes HTTP. |
| RNF-08 | Usar React com componentes funcionais; chamadas do frontend passam por `/api`, encaminhado pelo proxy do Vite. |
| RNF-09 | API e aplicação devem ser testáveis sem depender de serviços externos. |

## 5. Modelo de dados

Os metadados são mantidos em memória. O repositório também mantém uma referência interna ao arquivo salvo, que não faz parte da resposta pública.

| Campo | Tipo | Visibilidade | Descrição |
| --- | --- | --- | --- |
| `id` | string | Público | Identificador único, preferencialmente UUID. |
| `originalName` | string | Público | Nome original fornecido no upload; usado como nome de download, nunca como caminho. |
| `size` | number | Público | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Público | Instante do upload em ISO 8601 UTC. |
| `owner` | string | Público | Identificador do usuário proprietário. |
| `mimeType` | string | Público | Tipo MIME detectado/disponibilizado pelo middleware, quando disponível. |
| `storageName` | string | Interno | Nome gerado para localizar o arquivo no diretório local. Não expor na API. |

### Regras de dados

- `id` e `storageName` não podem ser derivados diretamente de entrada não confiável.
- `size` deve corresponder ao tamanho efetivamente gravado.
- `owner` vem do contexto de identidade confiável da aplicação, não de um campo arbitrário do formulário.
- A autenticação e a forma de estabelecer esse contexto não estão definidas pelo seed. Antes de habilitar usuários distintos, definir essa integração; não tratar um identificador enviado livremente pelo cliente como autenticação.

## 6. Contratos de API

As rotas do backend são `/upload`, `/documents` e `/documents/:id/download`, além de `/health`. No frontend, usar o prefixo `/api` configurado no proxy do Vite (por exemplo, `/api/documents`). Todas as respostas de erro da API usam JSON no formato `{ "error": { "code": "...", "message": "..." } }`.

### `POST /upload`

- Entrada: `multipart/form-data`, exatamente um arquivo no campo `file`.
- Proprietário: resolvido pelo contexto de identidade no servidor.
- Sucesso: `201 Created`, corpo JSON com os metadados públicos do documento.
- Erros: `400` para arquivo ausente ou requisição inválida; `413` para arquivo acima do limite configurado; `500` para falha inesperada de armazenamento.
- Não retornar `storageName` nem caminho absoluto/relativo local.

Exemplo de sucesso:

```json
{
  "id": "uuid",
  "originalName": "relatorio.pdf",
  "size": 1024,
  "uploadedAt": "2026-11-11T12:00:00.000Z",
  "owner": "user-123",
  "mimeType": "application/pdf"
}
```

### `GET /documents`

- Entrada: contexto de identidade do usuário; sem parâmetros obrigatórios.
- Sucesso: `200 OK`, corpo JSON `{ "documents": [...] }`, contendo apenas metadados públicos dos documentos do usuário atual.
- Ordenação: mais recentes primeiro; desempate determinístico por ID.
- Lista vazia: `200 OK` com `documents` vazio.
- Erros: `500` para falha inesperada ao consultar o repositório.

### `GET /documents/:id/download`

- Entrada: ID do documento no caminho e contexto de identidade.
- Sucesso: `200 OK`, bytes do arquivo, `Content-Type` conforme MIME conhecido (ou `application/octet-stream`) e `Content-Disposition` com o nome original tratado com segurança.
- Erros: `404` para ID inexistente ou documento de outro usuário; `500` para falha inesperada de leitura.

### `GET /health`

- Sucesso: `200 OK`, corpo `{ "status": "ok" }` enquanto o processo estiver apto a responder.

### Códigos e tratamento de erro

- `400 Bad Request`: formato da requisição inválido ou arquivo obrigatório ausente.
- `404 Not Found`: documento inexistente ou não pertencente ao usuário atual.
- `413 Payload Too Large`: limite de upload excedido.
- `500 Internal Server Error`: falha inesperada; mensagem pública genérica e detalhes somente em log do servidor.

## 7. Decisões arquiteturais

- Backend em Node.js e Express, CommonJS, dividido em `routes/`, `controllers/`, `services/` e `repositories/`.
- Rotas apenas conectam endpoints aos controllers. Controllers tratam HTTP e validação de entrada; services aplicam regras; repositories cuidam dos metadados em memória e do acesso ao arquivo local.
- `multer` com `diskStorage` grava em diretório local, por padrão `backend/storage`; diretório e limite de upload são configuráveis.
- O repositório mantém metadados em memória e uma referência interna ao arquivo. Nenhuma camada interna depende do Express.
- Frontend React/Vite usa `fetch` através do prefixo `/api` e do proxy local.
- A identidade do usuário é uma dependência a definir. Enquanto não houver autenticação, não considerar o campo `owner` enviado pelo cliente como mecanismo de controle de acesso.

## 8. Plano de execução

Etapas planejadas para uma implementação posterior. Este documento não executa nem especifica alterações concretas em arquivos de backend ou frontend.

1. Resolver as decisões pendentes de identidade do usuário, limite máximo de upload, diretório padrão e política de tipos de arquivo.
2. Definir os modelos de resposta e o tratamento uniforme de erros da API.
3. Implementar a gravação local com `multer`, nomes internos seguros e limpeza em caso de falha.
4. Implementar o repositório em memória e as regras de negócio de upload, listagem e propriedade.
5. Expor os contratos HTTP e verificar os casos de sucesso, validação, isolamento por proprietário e falhas de filesystem.
6. Implementar no frontend os fluxos de envio, listagem, estado vazio/erro e download usando o proxy `/api`.
7. Validar o fluxo integrado, a configuração por ambiente e a documentação das limitações de persistência.

## 9. Decisões pendentes

- Qual mecanismo fornecerá a identidade autenticada e o identificador `owner`?
- Qual será o valor padrão do limite máximo de upload?
- Quais tipos de arquivo, se houver, serão permitidos ou bloqueados?
- O diretório `backend/storage` será persistido por volume no ambiente de execução?