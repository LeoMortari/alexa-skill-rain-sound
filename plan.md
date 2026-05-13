# Skill Alexa "Som de Chuva" — Documentação do Projeto

> **Data de início:** 2026-05-12
> **Status:** Estrutura base completa, pronto para deploy e testes
> **Agente original:** Kimi Code CLI
> **Objetivo:** Documentar tudo para que outro agente de código possa continuar sem perder contexto

---

## 1. Ideia e Origem

O usuário quer uma skill extremamente simples para **Amazon Echo Show 8** com uma única funcionalidade: reproduzir um arquivo MP3 de som de chuva (1 hora de duração) em **loop contínuo**, até que o usuário peça para parar ou pausar/retomar.

### Requisitos originais
- Apenas Node.js
- Foco exclusivo Echo Show 8 (mas funciona em qualquer dispositivo Alexa com AudioPlayer)
- Super simples, sem complicações
- O usuário fornecerá o arquivo MP3 (não uma URL externa)
- O MP3 será hospedado na infraestrutura da Amazon (AWS S3 + Lambda)

---

## 2. Arquitetura Definida

| Componente | Tecnologia | Motivo |
|------------|-----------|--------|
| **Runtime** | Node.js 18.x (AWS Lambda) | Único requisito do usuário |
| **Framework** | `ask-sdk-core` + `ask-sdk-model` | SDK oficial da Amazon |
| **Storage do áudio** | Amazon S3 | O usuário fornecerá o MP3 e quer hospedar na AWS |
| **Compute** | AWS Lambda (serverless) | Integração nativa com Alexa Skills Kit |
| **Deploy da skill** | ASK CLI ou Console Web | Flexibilidade para o usuário |

### Decisão importante: S3 público vs privado
- **Decisão:** Bucket S3 **público com leitura anônima** (Opção A)
- **Motivo:** É apenas um som de chuva sem dados sensíveis. A URL fica fixa e simples (`https://bucket.s3.amazonaws.com/rain-sound.mp3`). Não requer IAM role com permissões extras na Lambda.
- **Alternativa:** O código já suporta URL pré-assinada (Opção B) via AWS SDK — está comentado em `lambda/util.js` se o usuário mudar de ideia no futuro.

---

## 3. Estrutura de Arquivos do Projeto

```
skill-chuva/
│
├── plan.md                          ← ESTE ARQUIVO (documentação completa)
├── README.md                        ← Guia de deploy e uso (para humanos)
│
├── skill.json                       ← Manifest da skill (nome, descrição, endpoint Lambda)
│
├── interactionModels/               ← Cópia do modelo de interação NA RAIZ
│   └── pt-BR.json                   ← (necessário para importação no console da Alexa)
│
├── skill-package/                   ← Mesmo conteúdo, estrutura ASK CLI v2
│   └── interactionModels/
│       └── pt-BR.json
│
├── lambda/                          ← Código da função AWS Lambda
│   ├── index.js                     ← Entry point: registra todos os handlers
│   ├── config.js                    ← Configurações: nome do bucket S3, chave do objeto MP3, token
│   ├── util.js                      ← Helpers: gera URL do S3, cria directives do AudioPlayer
│   ├── package.json                 ← Dependências: ask-sdk-core, ask-sdk-model, aws-sdk
│   └── handlers/                    ← Handlers modulares (um por arquivo)
│       ├── LaunchRequestHandler.js      # "Alexa, abrir chuva"
│       ├── PlayIntentHandler.js         # "Alexa, tocar chuva"
│       ├── PauseIntentHandler.js        # "Alexa, pausar"
│       ├── ResumeIntentHandler.js       # "Alexa, continuar"
│       ├── StopIntentHandler.js         # "Alexa, parar" / "cancelar"
│       ├── HelpIntentHandler.js         # "Alexa, ajuda"
│       ├── PlaybackNearlyFinishedHandler.js  # LOOP: reenfileira o áudio quando está quase acabando
│       ├── SessionEndedHandler.js       # Log quando sessão termina
│       └── ErrorHandler.js              # Tratamento genérico de erros
│
├── infra/
│   └── s3-public-policy.json        ← Política IAM para bucket S3 público (leitura anônima)
│
└── package-for-console.sh           ← Script que gera ZIP pronto para importação no console da Alexa
```

### Nota sobre pastas duplicadas
- `interactionModels/` na raiz = necessário para importação no **console web** da Alexa
- `skill-package/interactionModels/` = formato esperado pelo **ASK CLI v2**
- Ambos têm o MESMO conteúdo. Se editar um, edite o outro também (ou remova `skill-package/` se não usar ASK CLI).

---

## 4. Como Funciona a Skill (Fluxo Completo)

### 4.1 Iniciar reprodução

```
Usuário: "Alexa, abrir chuva"
         → LaunchRequest
         → LaunchRequestHandler
         → util.getAudioUrl() retorna URL do S3
         → Envia directive AudioPlayer.Play (REPLACE_ALL)
         → Echo começa a tocar o MP3
```

### 4.2 Loop automático (a mágica)

```
MP3 está quase acabando (~30s antes do fim)
         → Evento AudioPlayer.PlaybackNearlyFinished
         → PlaybackNearlyFinishedHandler
         → Envia NOVO directive AudioPlayer.Play (ENQUEUE)
         → Quando o atual termina, o próximo já está na fila
         → Como é o mesmo arquivo de 1h, o loop é "infinito"
```

**Por que ENQUEUE e não REPLACE_ALL no loop?**
- `ENQUEUE` adiciona o próximo na fila sem interromper o atual. Isso evita gaps de silêncio entre as repetições.

### 4.3 Pausar

```
Usuário: "Alexa, pausar"
         → AMAZON.PauseIntent
         → PauseIntentHandler
         → Envia directive AudioPlayer.Stop
         → Reprodução pausada
```

### 4.4 Retomar

```
Usuário: "Alexa, continuar"
         → AMAZON.ResumeIntent
         → ResumeIntentHandler
         → Envia AudioPlayer.Play (REPLACE_ALL) com URL nova
         → Recomeça do início (aceitável para som contínuo de chuva)
```

### 4.5 Parar completamente

```
Usuário: "Alexa, parar"
         → AMAZON.StopIntent (ou CancelIntent)
         → StopIntentHandler
         → Fala "Som de chuva encerrado. Até logo!"
         → Envia AudioPlayer.Stop
         → Encerra a skill (withShouldEndSession: true)
```

---

## 5. Configurações Editáveis

### 5.1 Arquivo `lambda/config.js`

```js
module.exports = {
  S3_BUCKET: process.env.S3_BUCKET || 'skill-chuva-audio',
  S3_KEY: process.env.S3_KEY || 'rain-sound.mp3',
  AUDIO_TOKEN: 'rain-loop-token'
};
```

| Campo | Descrição | O que mudar |
|-------|-----------|-------------|
| `S3_BUCKET` | Nome do bucket S3 onde o MP3 está | Nome do bucket real que você criou |
| `S3_KEY` | Caminho/nome do arquivo dentro do bucket | Se o arquivo tiver outro nome |
| `AUDIO_TOKEN` | Identificador interno do stream | Não precisa mudar |

### 5.2 Variáveis de ambiente da Lambda (opcional)

Se preferir não editar código, pode definir no console da AWS Lambda:
- `S3_BUCKET` = nome do bucket
- `S3_KEY` = nome do arquivo
- `AWS_REGION` = região do bucket (padrão: us-east-1)

### 5.3 Arquivo `skill.json`

**IMPORTANTE:** O campo `endpoint.uri` contém um valor placeholder:

```json
"endpoint": {
  "uri": "arn:aws:lambda:us-east-1:ACCOUNT_ID:function:skill-chuva"
}
```

**DEVE ser substituído** pelo ARN real da sua função Lambda após criá-la na AWS.

---

## 6. Problemas Encontrados e Soluções

### Problema 1: Importação no console da Alexa falhava

**Sintoma:** Usuário subiu a pasta no GitHub, baixou o ZIP e tentou importar no console web (`developer.amazon.com/alexa/console/ask`). Recebeu erro de "formato diferente do aceito".

**Causa raiz:**
1. O ZIP do GitHub vem com uma pasta raiz extra (ex: `skill-chuva-main/`). O console exige que `skill.json` esteja na raiz do ZIP.
2. O modelo de interação estava em `skill-package/interactionModels/`, mas o console procura em `interactionModels/` na raiz.
3. Arquivos extras (README, infra, plan.md) não causam erro, mas a estrutura de pastas sim.

**Solução aplicada:**
- Criou `interactionModels/pt-BR.json` na raiz (cópia do conteúdo)
- Criou script `package-for-console.sh` que gera ZIP limpo com apenas:
  - `skill.json`
  - `interactionModels/pt-BR.json`
  - `lambda/` (todo o código)
- O script exclui `node_modules/` e `package-lock.json` do ZIP

**Arquivo gerado:** `skill-chuva-console.zip`

### Problema 2: S3 público é seguro?

**Decisão:** Sim, para este caso. Discussão completa no histórico do chat. Resumo: é apenas um MP3 de som ambiente, sem dados sensíveis, e a política só permite `GetObject` (leitura), não escrita.

---

## 7. Modelo de Interação (Intents em Português)

Arquivo: `interactionModels/pt-BR.json` (e `skill-package/interactionModels/pt-BR.json`)

| Intent | Tipo | Frases de exemplo |
|--------|------|------------------|
| `LaunchRequest` | Sistema | "abrir chuva", "iniciar chuva" (invocationName) |
| `PlayIntent` | Custom | "tocar chuva", "tocar som de chuva", "começar chuva", "iniciar som de chuva", "quero ouvir chuva", "pôr chuva", "colocar chuva" |
| `AMAZON.PauseIntent` | Built-in | "pausar", "parar um pouco" |
| `AMAZON.ResumeIntent` | Built-in | "continuar", "voltar a tocar" |
| `AMAZON.StopIntent` | Built-in | "parar", "sair", "fechar" |
| `AMAZON.CancelIntent` | Built-in | "cancelar" |
| `AMAZON.HelpIntent` | Built-in | "ajuda", "o que posso fazer" |

**Invocation name:** `chuva`

---

## 8. Próximos Passos Pendentes (TODO)

### 🔴 Críticos (bloqueiam o funcionamento)

1. **[ ] Criar bucket S3 na AWS**
   ```bash
   aws s3 mb s3://skill-chuva-audio
   ```

2. **[ ] Fazer upload do MP3 para o S3**
   ```bash
   aws s3 cp rain-sound.mp3 s3://skill-chuva-audio/rain-sound.mp3
   ```

3. **[ ] Tornar o bucket/objeto público (Opção A)**
   ```bash
   aws s3api put-bucket-policy --bucket skill-chuva-audio --policy file://infra/s3-public-policy.json
   ```
   > ⚠️ Edite `infra/s3-public-policy.json` para usar o nome real do bucket no ARN.

4. **[ ] Criar função Lambda na AWS**
   - Runtime: Node.js 18.x
   - Região: us-east-1 (obrigatório para skills BR)
   - Handler: index.handler
   - Código: zipar a pasta `lambda/` (sem `node_modules/`, depois de rodar `npm install`)

5. **[ ] Atualizar `skill.json` com ARN real da Lambda**

6. **[ ] Configurar trigger "Alexa Skills Kit" na Lambda**

7. **[ ] Criar skill no Console Developer Alexa**
   - Importar via `skill-chuva-console.zip`, OU
   - Criar manualmente e copiar interaction model + endpoint

8. **[ ] Testar no simulador ou na Echo Show 8**

### 🟡 Melhorias futuras (opcional)

- [ ] Adicionar testes unitários (Jest + ask-sdk-test)
- [ ] Adicionar handler `PlaybackFailed` para tratamento de erro de streaming
- [ ] Adicionar handler `PlaybackFinished` (log apenas)
- [ ] Salvar offset de pausa e retomar do mesmo ponto (requer atributos de sessão/persistência)
- [ ] Adicionar imagem/cover para Echo Show 8 (displayRender)
- [ ] Suporte a comandos de volume via intents customizadas
- [ ] Timer automático: "tocar chuva por 30 minutos"

---

## 9. Dependências e Versões

```json
{
  "ask-sdk-core": "^2.14.0",
  "ask-sdk-model": "^1.19.1",
  "aws-sdk": "^2.1560.0"
}
```

- `ask-sdk-core`: Framework principal para handlers e responseBuilder
- `ask-sdk-model`: Tipos e interfaces do Alexa Skills Kit
- `aws-sdk`: Necessário apenas se usar URL pré-assinada do S3 (Opção B). Se usar bucket público, pode ser removido do `package.json` para reduzir tamanho.

---

## 10. Notas Técnicas para o Próximo Agente

### 10.1 AudioPlayer Behavior Values
- `REPLACE_ALL`: Para tudo e toca o novo. Usado para iniciar ou retomar.
- `ENQUEUE`: Adiciona na fila sem interromper o atual. Usado no loop.
- `REPLACE_ENQUEUED`: Substitui o próximo da fila, mas não o atual.

### 10.2 Eventos do AudioPlayer (já tratados e pendentes)
| Evento | Handler | Status |
|--------|---------|--------|
| `AudioPlayer.PlaybackStarted` | — | Não implementado (não necessário) |
| `AudioPlayer.PlaybackNearlyFinished` | `PlaybackNearlyFinishedHandler.js` | ✅ Implementado |
| `AudioPlayer.PlaybackFinished` | — | Não implementado (log opcional) |
| `AudioPlayer.PlaybackStopped` | — | Não implementado (não necessário) |
| `AudioPlayer.PlaybackFailed` | — | ❌ Não implementado (recomendado) |

### 10.3 Sobre Echo Show 8
- A skill funciona exatamente igual em qualquer dispositivo Alexa com suporte a AudioPlayer.
- Echo Show 8 tem tela, mas esta skill é **apenas áudio** por design (simplicidade).
- Se quiser aproveitar a tela no futuro, adicionar `Alexa.Presentation.APL` ou `Display.RenderTemplate`.

### 10.4 Requisitos do MP3
- Formato: MPEG-2 ou MPEG-4
- Bitrate: 48kbps (recomendado) até 256kbps
- Sample rate: 22.05kHz, 44.1kHz ou 48kHz
- Canais: Mono ou estéreo
- Tamanho máximo: não há limite explícito para streaming, mas MP3s muito grandes (>100MB) podem ter latência inicial

### 10.5 Região
- A skill está configurada para **pt-BR** (Brasil)
- A Lambda DEVE estar em `us-east-1` (N. Virginia) porque é a única região compatível com skills BR no momento

---

## 11. Histórico de Decisões

| Data | Decisão | Motivo |
|------|---------|--------|
| 2026-05-12 | Projeto iniciado | Usuário quer skill simples para Echo Show 8 |
| 2026-05-12 | Node.js + Lambda + S3 | Único requisito era Node.js; S3 para hospedar MP3 |
| 2026-05-12 | Bucket S3 público | Simplicidade; conteúdo não sensível |
| 2026-05-12 | AudioPlayer com ENQUEUE para loop | Loop sem gap de silêncio |
| 2026-05-12 | Retomar do início (não salvar offset) | Simplicidade; som contínuo de chuva não precisa de precisão |
| 2026-05-12 | Estrutura duplicada interactionModels/ | Compatibilidade com console web + ASK CLI v2 |
| 2026-05-12 | Script package-for-console.sh | Resolver problema de importação no console da Alexa |

---

## 12. Links Úteis

- Console Developer Alexa: https://developer.amazon.com/alexa/console/ask
- Documentação AudioPlayer: https://developer.amazon.com/en-US/docs/alexa/custom-skills/audioplayer-interface-reference.html
- ASK CLI: https://developer.amazon.com/en-US/docs/alexa/smapi/quick-start-alexa-skills-kit-command-line-interface.html
- Requisitos de áudio: https://developer.amazon.com/en-US/docs/alexa/custom-skills/speech-synthesis-markup-language-ssml-reference.html#audio

---

> **Última atualização:** 2026-05-12
> **Próximo agente:** Leia TODO seção 8. Os itens críticos estão numerados de 1 a 8.
