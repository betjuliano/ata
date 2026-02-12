import re
import asyncio
from datetime import datetime
from typing import List, Optional
from bs4 import BeautifulSoup
import httpx
from fake_useragent import UserAgent
from pydantic import BaseModel
from serpapi import GoogleSearch

class Produto(BaseModel):
    titulo: str
    preco_atual: float
    preco_original: float
    desconto_percentual: int
    loja: str
    link_produto: str
    link_afiliado: Optional[str] = None
    rating: Optional[float] = None
    reviews: Optional[int] = None
    data_busca: str

class ResultadoBusca(BaseModel):
    metadata: dict
    produtos: List[Produto]

def limpar_preco(texto):
    if not texto: return 0.0
    try:
        # Remove pontos de milhar e converte vírgula para ponto
        limpo = str(texto).replace('.', '').replace(',', '.')
        # Pega apenas os números e o ponto decimal
        limpo = re.sub(r'[^\d.]', '', limpo)
        return float(limpo)
    except:
        return 0.0

def gerar_link_afiliado(link_original, loja):
    if "mercadolivre" in loja.lower():
        return f"https://www.mercadolivre.com.br/social/riparg2000?url={link_original}" 
    elif "amazon" in loja.lower():
        return link_original + "&tag=seu-tag-amazon"
    return link_original

async def buscar_mercadolivre(termo: str) -> List[Produto]:
    ua = UserAgent()
    headers = {
        'User-Agent': ua.random,
        'Accept-Language': 'pt-BR,pt;q=0.9',
        'Referer': 'https://www.google.com/'
    }
    url = f"https://lista.mercadolivre.com.br/{termo.replace(' ', '-')}"
    
    produtos = []
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get(url, headers=headers, follow_redirects=True)
            
        soup = BeautifulSoup(r.text, 'html.parser')
        cards = soup.select('div.ui-search-result__wrapper, li.ui-search-layout__item, div.poly-card')

        for card in cards[:15]:
            try:
                titulo_el = card.select_one('h2, h3')
                link_el = card.select_one('a')
                preco_el = card.select_one('span.andes-money-amount__fraction')
                
                if not titulo_el or not link_el or not preco_el: continue

                titulo = titulo_el.get_text().strip()
                link = link_el.get('href')
                
                preco_str = preco_el.get_text()
                centavos_el = card.select_one('span.andes-money-amount__cents')
                if centavos_el:
                    preco_str += "," + centavos_el.get_text()
                
                preco_atual = limpar_preco(preco_str)
                
                preco_original = preco_atual
                orig_container = card.select_one('s.andes-money-amount')
                if orig_container:
                    orig_frac = orig_container.select_one('span.andes-money-amount__fraction')
                    if orig_frac:
                        orig_str = orig_frac.get_text()
                        orig_cents = orig_container.select_one('span.andes-money-amount__cents')
                        if orig_cents:
                            orig_str += "," + orig_cents.get_text()
                        preco_original = limpar_preco(orig_str)
                
                desconto = 0
                if preco_original > preco_atual:
                    desconto = int(((preco_original - preco_atual) / preco_original) * 100)

                rating = None
                rating_el = card.select_one('span.ui-search-reviews__rating-number, span.poly-reviews__rating')
                if rating_el:
                    try: rating = float(rating_el.get_text().replace(',', '.'))
                    except: pass
                
                reviews = None
                reviews_el = card.select_one('span.ui-search-reviews__amount, span.poly-reviews__total')
                if reviews_el:
                    try: 
                        rev_text = re.sub(r'[^\d]', '', reviews_el.get_text())
                        if rev_text: reviews = int(rev_text)
                    except: pass

                produtos.append(Produto(
                    titulo=titulo,
                    preco_atual=preco_atual,
                    preco_original=preco_original,
                    desconto_percentual=desconto,
                    loja="Mercado Livre",
                    link_produto=link,
                    link_afiliado=gerar_link_afiliado(link, "Mercado Livre"),
                    rating=rating,
                    reviews=reviews,
                    data_busca=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                ))
            except Exception:
                continue
    except Exception as e:
        print(f"Erro ML: {e}")
        
    return produtos

async def buscar_google_shopping(termo: str, api_key: str) -> List[Produto]:
    produtos = []
    if not api_key or api_key == "SUA_CHAVE_SERPAPI_AQUI" or api_key == "":
        return produtos

    params = {
        "engine": "google_shopping",
        "q": termo,
        "gl": "br",
        "hl": "pt",
        "api_key": api_key,
        "num": 20
    }

    try:
        search = GoogleSearch(params)
        results = await asyncio.to_thread(search.get_dict)
        shopping_results = results.get("shopping_results", [])
        
        for item in shopping_results:
            source = item.get("source", "")
            preco = item.get("extracted_price", 0.0)
            old_price = item.get("old_price", preco)
            
            if isinstance(old_price, str):
                old_price = limpar_preco(old_price)

            desconto = 0
            if old_price > preco:
                desconto = int(((old_price - preco) / old_price) * 100)

            produtos.append(Produto(
                titulo=item.get("title"),
                preco_atual=float(preco),
                preco_original=float(old_price),
                desconto_percentual=desconto,
                loja=source,
                link_produto=item.get("link"),
                link_afiliado=gerar_link_afiliado(item.get("link"), source),
                rating=item.get("rating"),
                reviews=item.get("reviews"),
                data_busca=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            ))
            
    except Exception as e:
        print(f"Erro SerpApi: {e}")

    return produtos
