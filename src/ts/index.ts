import { Cart } from './Cart';
import { CartItem } from './CartItem';
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
      <button type="button" class="add-to-cart">
        <input type="hidden" class="product-id" value="${product.id}">
        <input type="hidden" class="product-price" value="${product.price}">
        Comprar
      </button>
    </li>`;
    document.querySelector('#products-list ul').innerHTML += productLine;
  });

  const allProductsRendered = productsToRender.length === 0 || productsToRender.length < perPage;

  if (allProductsRendered) {
    document.querySelector('#load-products').remove();
  }

  document.querySelectorAll('.add-to-cart').forEach((button) => {
    button.addEventListener('click', () => {
      handleAddToCart(button);
    });
  });
}

async function handleLoadProducts(page = 1, perPage = 9) {
  await renderProducts(page, perPage);
}

function handleFilterButtons(container?: Element) {
  if (!container) {
    return;
  }

  container.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
}

function handleCloseIcon(e: Event) {
  (e.currentTarget as Node).parentElement.parentElement.setAttribute('hidden', 'hidden');
  document.body.style.overflow = 'initial';
}

function handleToggleFilter(element: Element) {
  const parentElement = element.parentElement;
  parentElement.classList.toggle('open');
  parentElement.querySelectorAll('label').forEach((label) => {
    label.toggleAttribute('hidden');
  });

  const sizes = parentElement.querySelector('ul');

  if (sizes) {
    if (parentElement.classList.contains('open')) {
      sizes.style.display = 'flex';
    } else {
      sizes.style.display = 'none';
    }
  }

  const buttons = document.querySelectorAll('#filter-button-container button');

  if (document.querySelectorAll('#filter-mobile .open').length > 0) {
    buttons.forEach((button) => {
      button.removeAttribute('hidden');
    });
  } else {
    buttons.forEach((button) => {
      button.setAttribute('hidden', 'hidden');
    });
  };
}

function handleSelectedSize(size: Element) {
  size.classList.toggle('selected-size');
}

function hideFiltersOnInit() {
  document.querySelectorAll('#filter-mobile label, #filter-button-container button').forEach((element) => {
    element.setAttribute('hidden', 'hidden');
  });

  (document.querySelector('#filter-mobile .size-filter ul') as HTMLElement).style.display = 'none';
}

function initializeMobileFilterButtons() {
  document.querySelector('#ordering-button').addEventListener('click', () => {
    handleFilterButtons(document.querySelector('#ordering-container'));
  });

  document.querySelector('#filtering-button').addEventListener('click', () => {
    handleFilterButtons(document.querySelector('#filtering-container'));
  });
}

function initializeMobileFilters() {
  initializeMobileFilterButtons();

  document.querySelectorAll('.close-icon').forEach((element) => {
    element.addEventListener('click', handleCloseIcon);
  });

  hideFiltersOnInit();

  document.querySelectorAll('#filter-mobile .filter-text').forEach((element) => {
    element.addEventListener('click', () => {
      handleToggleFilter(element);
    });
  });
}

function initializeDesktopFilters() {
  document.querySelectorAll('#filter .color-filter label:nth-last-child(-n+6)').forEach((label) => {
    (label as HTMLElement).style.display = 'none';
  });

  const showAllColorsElement = document.querySelector('#show-all-colors');

  showAllColorsElement.addEventListener('click', () => {
    document.querySelectorAll('#filter .color-filter label[style*="display: none"').forEach((label) => {
      (label as HTMLElement).style.display = 'flex';
    });

    showAllColorsElement.setAttribute('hidden', 'hidden');
  });
}

function initializeFilters() {
  initializeMobileFilters();
  initializeDesktopFilters();

  document.querySelectorAll('.size-filter ul li').forEach((size) => {
    size.addEventListener('click', () => {
      handleSelectedSize(size);
    });
  });
}

function updateCartItemCount(cart: Cart) {
  const totalItemsInCart = getTotalItemsFromCart(cart);
  document.querySelector('#shopping-cart-item-count').textContent = totalItemsInCart.toString();
}

function getTotalItemsFromCart(cart: Cart) {
  return cart.items
    .map((item) => item.quantity)
    .reduce(
      (previousQuantity, currentQuantity) => previousQuantity + currentQuantity, 0
    );
}

function getCart(): Cart {
  return JSON.parse(localStorage.getItem('cart')) || {
    items: [],
  };
}

function addToCart({ productId, price, quantity }: CartItem) {
  const cart = getCart();
  const cartItems = [...cart.items];
  const itemInCart = cartItems.find((item) => item.productId === productId);

  if (itemInCart) {
    cartItems.find((item) => item.productId === productId).quantity++;
  } else {
    const itemToAddInCart = {
      productId,
      quantity,
      price,
    };
    cartItems.push(itemToAddInCart);
  }

  cart.items = cartItems;
  localStorage.setItem('cart', JSON.stringify(cart));

  updateCartItemCount(cart);
}

function handleAddToCart(button: Element) {
  const productIdInput: HTMLInputElement = button.querySelector('.product-id');
  const productPriceInput: HTMLInputElement = button.querySelector('.product-price');
  const productId = productIdInput.value;
  const productPrice = parseFloat(productPriceInput.value);
  addToCart({ productId, price: productPrice, quantity: 1 });
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
    await handleLoadProducts(++page, perPage);
  });

  initializeFilters();

  updateCartItemCount(getCart());
}

document.addEventListener("DOMContentLoaded", main);
