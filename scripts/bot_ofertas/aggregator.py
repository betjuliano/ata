import asyncio
from datetime import datetime
from typing import List
from engines import Produto, ResultadoBusca, buscar_mercadolivre, buscar_google_shopping

def calcular_score(p: Produto):
    rating = p.rating if p.rating else 4.0
    reviews = p.reviews if p.reviews else 0
    
    # Lógica solicitada: (rating * 10) + (reviews * 0.05) - (preco / 1000)
    score = (rating * 10) + (reviews * 0.05) - (p.preco_atual / 1000)
    
    # Bônus para desconto
    score += p.desconto_percentual * 0.1
    
    return score

async def orquestrador_busca(termo: str, serpapi_key: str) -> ResultadoBusca:
    # Execução paralela
    resultados_ml, resultados_gerais = await asyncio.gather(
        buscar_mercadolivre(termo),
        buscar_google_shopping(termo, serpapi_key)
    )
    
    todos_produtos = resultados_ml + resultados_gerais
    
    # Ordenação por score
    todos_produtos.sort(key=calcular_score, reverse=True)
    
    return ResultadoBusca(
        metadata={
            "data": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "total": len(todos_produtos),
            "termo_pesquisado": termo,
            "nota": "Ranking gerado via IA Bot"
        },
        produtos=todos_produtos[:15]
    )
