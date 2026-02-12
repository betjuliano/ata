import os
import json
import logging
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, ContextTypes, filters
from aggregator import orquestrador_busca

# Configurações (Devem ser preenchidas pelo usuário ou via env vars)
SERPAPI_KEY = os.getenv("SERPAPI_KEY", "SUA_CHAVE_SERPAPI_AQUI")
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN", "SEU_TOKEN_TELEGRAM_AQUI")

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "👋 Olá! Eu sou o Bot de Ofertas Multi-Lojas.\n"
        "Me diga o nome de um produto e eu busco no ML, Amazon, Shopee, Magalu e AliExpress para você."
    )

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    termo = update.message.text
    status_msg = await update.message.reply_text(f"🔎 Buscando as melhores ofertas para: *{termo}*...", parse_mode='Markdown')
    
    try:
        resultado = await orquestrador_busca(termo, SERPAPI_KEY)
        
        if not resultado.produtos:
            await status_msg.edit_text("❌ Nenhum produto encontrado.")
            return

        # Gera o arquivo JSON
        json_filename = f"ofertas_{termo.replace(' ', '_')}.json"
        with open(json_filename, "w", encoding='utf-8') as f:
            # Pydantic v2 use model_dump_json, v1 use json()
            try:
                content = resultado.model_dump_json(indent=2)
            except AttributeError:
                content = resultado.json(indent=2, ensure_ascii=False)
            f.write(content)
        
        # Resposta formatada no chat
        response_text = f"🏆 *Top Ofertas para {termo.upper()}*\n\n"
        
        for i, p in enumerate(resultado.produtos[:5], 1):
            rating_star = "⭐" * int(p.rating) if p.rating else ""
            response_text += (
                f"*{i}. {p.titulo[:40]}...*\n"
                f"🏪 {p.loja}\n"
                f"💰 *R$ {p.preco_atual:,.2f}* " + (f"({p.desconto_percentual}% OFF)" if p.desconto_percentual > 0 else "") + "\n"
                f"{rating_star}\n"
                f"🔗 [Ver Oferta]({p.link_afiliado or p.link_produto})\n\n"
            )
        
        await status_msg.edit_text(response_text, parse_mode='Markdown', disable_web_page_preview=True)
        
        # Envia o JSON anexo
        with open(json_filename, 'rb') as doc:
            await update.message.reply_document(document=doc, filename=json_filename)
        
        # Limpeza
        os.remove(json_filename)

    except Exception as e:
        logging.error(f"Erro no processamento: {e}")
        await status_msg.edit_text("⚠️ Ocorreu um erro ao buscar os produtos.")

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    
    if not TELEGRAM_TOKEN or TELEGRAM_TOKEN == "SEU_TOKEN_TELEGRAM_AQUI":
        print("Erro: Configure o TELEGRAM_TOKEN no código ou variável de ambiente.")
    else:
        app = ApplicationBuilder().token(TELEGRAM_TOKEN).build()
        app.add_handler(CommandHandler("start", start))
        app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
        print("🤖 Bot rodando...")
        app.run_polling()
