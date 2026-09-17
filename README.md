# Hikvision Face Converter

Conversor e compressor de imagens para cadastro facial em leitores/controladores Hikvision.

Todo o processamento (redimensionamento, compressão e remoção de metadados EXIF) acontece
**localmente no navegador**, via Canvas API — nenhuma imagem é enviada para um servidor.

## Funcionalidades

- Upload por arraste ou seleção, com suporte a múltiplas imagens (conversão em lote).
- Compressão inteligente: busca binária de qualidade JPEG e, se necessário, redução progressiva
  de dimensões até atingir o tamanho máximo definido (mantendo sempre a proporção original).
- Tamanhos-alvo pré-definidos (50/100/150/200/250/500 KB) ou personalizado.
- Dimensões pré-definidas (1920×1080, 1280×720, 1024×768, 800×600, 640×480) ou personalizadas.
- Modo dedicado **Cadastro Facial Hikvision** (JPEG, até 200 KB, proporção preservada).
- Comparação antes/depois com indicador visual 🟢 aprovado / 🔴 acima do limite.
- Download individual ou "Baixar todas" (sem geração de ZIP — cada arquivo é baixado
  diretamente pelo navegador).
- Dark mode, layout responsivo, sem login e sem backend.

## Rodando localmente

```bash
npm install
npm run dev
```

## Build de produção (arquivo único e portátil)

```bash
npm run build
```

Isso gera **um único arquivo** em `dist/index.html`, com todo o JavaScript e CSS embutidos
(via `vite-plugin-singlefile`). Para usar em outra máquina:

1. Copie apenas o arquivo `dist/index.html` (pode renomeá-lo, ex.: `HikvisionFaceConverter.html`).
2. Cole em qualquer pasta do outro computador.
3. Dê duplo clique — ele abre direto no navegador padrão.

Não precisa instalar Node.js, servidor, nem nada extra na máquina de destino; funciona
totalmente offline, inclusive aberto direto do `file://`.

Para conferir localmente antes de copiar: `npm run preview`.

## Stack

React + TypeScript + Vite + Tailwind CSS v4.
