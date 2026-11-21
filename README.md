# Cinema — app de PC

Assista e compartilhe a tela com os amigos: https://cinema-juntos.vercel.app

> **Precisa de um código de acesso.** Na primeira vez que abrir, o app pede o seu código pessoal
> (`CINE-XXXXX-XXXXX`). Cada código vale em até 2 computadores. Não tem? Peça pro dono do Cinema.
> Desde a versão 1.2.0 o Cinema só funciona pelo app (não mais pelo navegador).

## Baixar (Windows)
Vá em **[Releases](../../releases/latest)** e baixe `Cinema-Portatil-x.x.x.exe`. Não precisa instalar: é só abrir.

> O Windows pode mostrar **"Windows protegeu o computador"** porque o app não tem assinatura digital paga.
> Clique em **Mais informações → Executar assim mesmo**.

## Baixar (Linux)
Na mesma página de **[Releases](../../releases/latest)**:
- **Mint / Ubuntu / Debian:** baixe `cinema_x.x.x_amd64.deb` e dê dois cliques pra instalar. O Cinema aparece no menu.
- **Qualquer Linux:** baixe `Cinema-x.x.x.AppImage`, clique com o botão direito → Propriedades → Permissões → *Permitir executar como programa*, e abra.

> No Linux o app compartilha a imagem, mas não o som do PC (limite do sistema).

## Como funciona
- Abre o site do Cinema numa janela própria, então atualiza sozinho.
- Na primeira vez, pede o código de acesso e vincula ao PC (pelo ID da máquina, embaralhado).
- Abre convites direto no app (`cinema://`): no navegador, é só clicar em **Abrir no app**.
- Tem um seletor de tela próprio (tela inteira ou janela).
- No Windows manda o som do PC inteiro.

## Gerar de novo
```
npm install
npm start                                 # abrir em modo de teste
npx electron-builder --win portable      # Windows → dist/ (o instalador NSIS precisa do Wine)
npx electron-builder --linux              # Linux (AppImage + .deb) → dist/
```
