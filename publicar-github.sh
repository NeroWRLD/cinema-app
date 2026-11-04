#!/bin/bash
# Cria o repositório público "cinema-app" no GitHub (se ainda não existir) e publica a versão atual do app.
set -e
cd "$(dirname "$0")"
V=$(node -p 'require("./package.json").version')
gh repo view cinema-app >/dev/null 2>&1 || gh repo create cinema-app --public --description "Cinema — app de PC pra assistir e compartilhar a tela com os amigos" --source . --push
git push -q origin main
gh release create "v$V" "dist/Cinema-Portatil-$V.exe" "dist/Cinema-$V-win-x64.zip" "dist/Cinema-$V.AppImage" "dist/cinema_${V}_amd64.deb" --title "Cinema $V" --notes "**Windows:** baixe **Cinema-Portatil-$V.exe** e abra. Não precisa instalar.

**Linux:** baixe **cinema_${V}_amd64.deb** (Mint, Ubuntu, Debian: dois cliques pra instalar) ou **Cinema-$V.AppImage** (qualquer Linux: clique direito → Propriedades → Permissões → permitir executar).

Se o Windows mostrar *\"Windows protegeu o computador\"*, clique em **Mais informações → Executar assim mesmo** (o app não tem assinatura digital paga). No Linux o app não manda o som do PC, só a imagem."
echo "Pronto! Link pra mandar pros amigos:"
echo "https://github.com/$(gh api user -q .login)/cinema-app/releases/latest"
