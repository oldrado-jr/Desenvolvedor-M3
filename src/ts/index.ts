import { Product } from './Product';

async function getProducts(): Promise<Product[]> {
  const serverUrl = 'http://localhost:5000';
  const response = await fetch(`${serverUrl}/products`);
  return await response.json();
}

async function renderProducts(page = 1, perPage = 9) {
  const products = await getProducts();
  const productsToRender = products.splice((page - 1) * perPage, perPage);

  productsToRender.map((product, index) => {
    if (index >= perPage) {
      return;
    }

    const productLine = `<li>
      <img src="${product.image}" alt="${product.name}">
      <span class="product-name">${product.name}</span>
      <div>
        <span class="product-price">R$${product.price.toFixed(2).replace('.', ',')}</span>
        <span class="product-installment">até ${product.parcelamento[0]}x de R$${product.parcelamento[1].toFixed(2).replace('.', ',')}</span>
      </div>
      <button type="button">Comprar</button>
    </li>`;
    document.querySelector('#products-list ul').innerHTML += productLine;
  });

  const allProductsRendered = productsToRender.length === 0 || productsToRender.length < perPage;

  if (allProductsRendered) {
    document.querySelector('#load-products').remove();
  }
}

async function main() {
  let page = 1;
  let perPage = 9;
  const baseWidth = 700;

  if (document.body.offsetWidth <= baseWidth) {
    perPage = Math.trunc(Math.floor(perPage / 2));
  }

  await renderProducts(page, perPage);

  document.querySelector('#load-products').addEventListener('click', async () => {
    await renderProducts(++page, perPage);
  });
}

document.addEventListener("DOMContentLoaded", main);
