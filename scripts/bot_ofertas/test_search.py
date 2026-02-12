import asyncio
import json
from aggregator import orquestrador_busca

async def main():
    termo = "notebook"
    print(f"Testando busca por: {termo}")
    
    # Nota: Sem chave SerpApi, ele testará apenas o Mercado Livre
    resultado = await orquestrador_busca(termo, "SUA_CHAVE_SERPAPI_AQUI")
    
    print(f"Total de produtos encontrados: {resultado.metadata['total']}")
    
    if resultado.produtos:
        print("\nTop 3 Produtos:")
        for p in resultado.produtos[:3]:
            print(f"- {p.titulo} | {p.loja} | R$ {p.preco_atual}")
        
        # Salva amostra JSON
        with open("test_output.json", "w", encoding='utf-8') as f:
            try:
                content = resultado.model_dump_json(indent=2)
            except AttributeError:
                content = resultado.json(indent=2, ensure_ascii=False)
            f.write(content)
        print("\nSaída JSON salva em test_output.json")
    else:
        print("Nenhum produto encontrado no teste.")

if __name__ == "__main__":
    asyncio.run(main())
