import { Cart } from './Cart';
import { CartItem } from './CartItem';
import { Product } from './Product';

async function getProducts(): Promise<Product[]> {
  const serverUrl = 'http://localhost:5000';
  const response = await fetch(`${serverUrl}/products`);
  return await response.json();
}

function filterProducts(
  products: Product[],
  colors: string[],
  sizes: string[],
  priceIntervals: string[][]
) {
  const needToFilter = colors.length > 0
    || sizes.length > 0
    || priceIntervals.length > 0;

  if (needToFilter) {
    return products.filter(
      (product) => {
        const productHasSelectedColor = colors.length === 0 || colors.includes(product.color);
        const productHasSelectedSize = sizes.length === 0 || product.size.filter((size) => sizes.includes(size)).length > 0;
        const productPriceIsBetweenInterval = priceIntervals.length === 0
          || priceIntervals.filter(
            (priceInterval) => product.price >= parseInt(priceInterval[0])
              && (
                priceInterval[1].length === 0
                || product.price <= parseInt(priceInterval[1])
              )
          ).length > 0;
        return productHasSelectedColor && productHasSelectedSize && productPriceIsBetweenInterval;
      }
    );
  }

  return [...products];
}

async function renderProducts(
  page = 1,
  perPage = 9,
  colors: string[] = [],
  sizes: string[] = [],
  priceIntervals: string[][] = [],
  orderingCallback?: (product1: Product, product2: Product) => number
) {
  const products = await getProducts();
  const filteredProducts = filterProducts(products, colors, sizes, priceIntervals);

  if (orderingCallback) {
    filteredProducts.sort(orderingCallback);
  }

  const productsToRender = filteredProducts.splice((page - 1) * perPage, perPage);

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

  const allProductsRendered = productsToRender.length === 0
    || productsToRender.length < perPage
    || filteredProducts.length === 0;
  const loadProductsButton = document.querySelector('#load-products');

  if (allProductsRendered) {
    loadProductsButton.setAttribute('hidden', 'hidden');
  } else {
    loadProductsButton.removeAttribute('hidden');
  }

  document.querySelectorAll('.add-to-cart').forEach((button) => {
    button.addEventListener('click', () => {
      handleAddToCart(button);
    });
  });
}

async function handleLoadProducts(page: number, perPage: number) {
  let deviceType = 'desktop';
  let orderingType = (document.querySelector('#product-ordering-desktop') as HTMLSelectElement).value;

  if (isMobile()) {
    deviceType = 'mobile';
    orderingType = '';
  }

  const orderingCallback = getOrderingCallback(orderingType);
  const { selectedColors, selectedSizes, selectedPriceIntervals } = getFilters(deviceType);
  await renderProducts(page, perPage, selectedColors, selectedSizes, selectedPriceIntervals, orderingCallback);
}

function getOrderingCallback(orderingType: string) {
  let orderingCallback;

  switch (orderingType) {
    case 'mais-recentes':
      orderingCallback = (product1: Product, product2: Product) => {
        return -(new Date(product1.date).getTime() - new Date(product2.date).getTime());
      };

      break;
    case 'menor-preco':
      orderingCallback = (product1: Product, product2: Product) => {
        return product1.price - product2.price;
      };

      break;
    case 'maior-preco':
      orderingCallback = (product1: Product, product2: Product) => {
        return -(product1.price - product2.price);
      };

      break;
  }

  return orderingCallback;
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

function hasSelectedFilter(
  selectedColors: string[],
  selectedSizes: string[],
  selectedPriceIntervals: string[][]
) {
  return selectedColors.length > 0
    || selectedSizes.length > 0
    || selectedPriceIntervals.length > 0;
}

async function handleFilter(perPage: number) {
  const orderingType = (document.querySelector('#product-ordering-desktop') as HTMLSelectElement).value;
  const orderingCallback = getOrderingCallback(orderingType);
  const { selectedColors, selectedSizes, selectedPriceIntervals } = getDesktopFilters();
  document.querySelector('#products-list ul').innerHTML = '';
  await renderProducts(1, perPage, selectedColors, selectedSizes, selectedPriceIntervals, orderingCallback);
}

async function handleMobileFilter(perPage: number) {
  const { selectedColors, selectedSizes, selectedPriceIntervals } = getMobileFilters();

  if (!hasSelectedFilter(selectedColors, selectedSizes, selectedPriceIntervals)) {
    return;
  }

  document.querySelector('#products-list ul').innerHTML = '';
  await renderProducts(1, perPage, selectedColors, selectedSizes, selectedPriceIntervals);
}

function handleClearMobileFilters() {
  document
    .querySelectorAll(
    '.color-checkbox-mobile:checked, .price-interval-checkbox-mobile:checked'
    ).forEach((checkbox) => {
      (checkbox as HTMLInputElement).checked = false;
    });
  document
    .querySelectorAll('.size-filter li.filter-type-mobile.selected-size')
    .forEach((sizeLi) => {
      sizeLi.classList.remove('selected-size');
    });
}

function getDesktopFilters() {
  const deviceType = 'desktop';
  return getFilters(deviceType);
}

function getMobileFilters() {
  const deviceType = 'mobile';
  return getFilters(deviceType);
}

function getFilters(deviceType: string) {
  const selectedColors = Array.from(
    document.querySelectorAll(`.color-checkbox-${deviceType}:checked`)
  ).map((selectedCheckbox) => (selectedCheckbox as HTMLInputElement).value);
  const selectedPriceIntervals = Array.from(
    document.querySelectorAll(`.price-interval-checkbox-${deviceType}:checked`)
  ).map((selectedCheckbox) => (selectedCheckbox as HTMLInputElement).value.split(','));
  const selectedSizes = Array.from(
    document.querySelectorAll(`.size-filter li.filter-type-${deviceType}.selected-size`)
  ).map((selectedSizeLi) => selectedSizeLi.textContent.trim());

  return { selectedColors, selectedSizes, selectedPriceIntervals };
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

  document.querySelectorAll('#filter-mobile span.filter-text').forEach((element) => {
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

function isMobile() {
  const baseWidth = 700;
  return document.body.offsetWidth <= baseWidth;
}

async function main() {
  let page = 1;
  let perPage = 9;

  if (isMobile()) {
    perPage = Math.trunc(Math.floor(perPage / 2));
  }

  await renderProducts(page, perPage);

  document.querySelector('#load-products').addEventListener('click', async () => {
    await handleLoadProducts(++page, perPage);
  });

  initializeFilters();
  updateCartItemCount(getCart());

  document.querySelectorAll('#filter .color-filter input[type="checkbox"], #filter .price-filter input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener('change', async () => {
      page = 1;
      await handleFilter(perPage);
    });
  });

  document.querySelectorAll('.size-filter ul li').forEach((size) => {
    size.addEventListener('click', async () => {
      page = 1;
      handleSelectedSize(size);

      if (size.classList.contains('filter-type-desktop')) {
        await handleFilter(perPage);
      }
    });
  });

  document.querySelector('#apply-mobile-filter').addEventListener('click', async () => {
    page = 1;
    await handleMobileFilter(perPage);
  });

  document.querySelector('#clear-mobile-filter').addEventListener('click', async () => {
    page = 1;
    handleClearMobileFilters();
    document.querySelector('#products-list ul').innerHTML = '';
    await renderProducts(page, perPage);
  });

  document.querySelector('#product-ordering-desktop').addEventListener('change', async (e) => {
    page = 1;
    const orderingType = (e.target as HTMLSelectElement).value;
    const orderingCallback = getOrderingCallback(orderingType);
    const { selectedColors, selectedSizes, selectedPriceIntervals } = getDesktopFilters();
    document.querySelector('#products-list ul').innerHTML = '';
    await renderProducts(page, perPage, selectedColors, selectedSizes, selectedPriceIntervals, orderingCallback);
  });
}

document.addEventListener("DOMContentLoaded", main);
