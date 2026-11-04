# Cinema — app de PC

Assista e compartilhe a tela com os amigos: https://cinema-juntos.vercel.app

## Baixar (Windows)
Vá em **[Releases](../../releases/latest)** e baixe `Cinema-Portatil-x.x.x.exe`. Não precisa instalar: é só abrir.

> O Windows pode mostrar **"Windows protegeu o computador"** porque o app não tem assinatura digital paga.
> Clique em **Mais informações → Executar assim mesmo**.

## Como funciona
- Abre o site do Cinema numa janela própria, então atualiza sozinho.
- Tem um seletor de tela próprio (tela inteira ou janela).
- No Windows manda o som do PC inteiro.

## Gerar de novo
```
npm install
npm start                                 # abrir em modo de teste
npx electron-builder --win portable zip   # gera os arquivos em dist/
```
