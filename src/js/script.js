/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  ('use strict');

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product', // CODE ADDED
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount', // CODE CHANGED
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    // CODE ADDED START
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice:
        '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
    // CODE ADDED END
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    // CODE ADDED START
    cart: {
      wrapperActive: 'active',
    },
    // CODE ADDED END
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 0,
      defaultMax: 10,
    }, // CODE CHANGED
    // CODE ADDED START
    cart: {
      defaultDeliveryFee: 20,
    },
    // CODE ADDED END

    db: {
      url: '//localhost:3131',
      products: 'products',
      orders: 'orders',
    },
  };

  const templates = {
    menuProduct: Handlebars.compile(
      document.querySelector(select.templateOf.menuProduct).innerHTML
    ),
    // CODE ADDED START
    cartProduct: Handlebars.compile(
      document.querySelector(select.templateOf.cartProduct).innerHTML
    ),
    // CODE ADDED END
  };

  class Product {
    constructor(id, data) {
      const thisProduct = this;
      // console.log('thisProduct', thisProduct);

      thisProduct.id = id;
      thisProduct.data = data;

      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAmountWidget();
      thisProduct.initAcordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();

      // console.log('new Product', thisProduct);
    }

    renderInMenu() {
      const thisProduct = this;

      /* generate HTML based on template */
      const generateHTML = templates.menuProduct(thisProduct.data);
      // console.log(generateHTML);

      /* create element using  utils.createElementDOMFromHTML*/
      thisProduct.element = utils.createDOMFromHTML(generateHTML);

      /*  */

      const menuContainer = document.querySelector(select.containerOf.menu);

      /* add element to menu */
      menuContainer.appendChild(thisProduct.element);
    }

    getElements() {
      // metoda // trzyma refefencje

      const thisProduct = this;

      thisProduct.accordionTrigger = thisProduct.element.querySelector(
        select.menuProduct.clickable
      );
      thisProduct.form = thisProduct.element.querySelector(
        select.menuProduct.form
      );
      thisProduct.formInputs = thisProduct.form.querySelectorAll(
        select.all.formInputs
      );
      thisProduct.cartButton = thisProduct.element.querySelector(
        select.menuProduct.cartButton
      );
      thisProduct.priceElem = thisProduct.element.querySelector(
        select.menuProduct.priceElem
      );
      thisProduct.imageWrapper = thisProduct.element.querySelector(
        select.menuProduct.imageWrapper
      );
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(
        select.menuProduct.amountWidget
      );
    }

    initAcordion() {
      const thisProduct = this;

      /* find the clickable trigger (the element that should react to clicking) */
      // const hid = thisProduct.element.querySelector(
      //   select.menuProduct.clickable
      // );
      // console.log('clickableTrigger:', clickableTrigger);

      /* START: add event listener to clickable trigger on event click */
      thisProduct.accordionTrigger.addEventListener('click', function (event) {
        /* prevent default action for event */
        event.preventDefault();
        // console.log(clickableTrigger);

        /* find active product (product that has active class) */

        const activeProduct = document.querySelector(
          select.all.menuProductsActive
        );

        /* if there is active product and it's not thisProduct.element, remove class active from it */
        // console.log(thisProduct.element);
        // console.log(thisProduct);
        if (activeProduct && activeProduct != thisProduct.element) {
          activeProduct.classList.remove('active');
        }

        /* toggle active class on thisProduct.element */

        thisProduct.element.classList.toggle('active');
      });
    }

    //dodanie listenerów eventów do formularza, jego kontrolek, oraz guzika dodania do koszyka
    initOrderForm() {
      const thisProduct = this;
      // console.log('initOrderProduct:');

      thisProduct.form.addEventListener('submit', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
      });

      for (let input of thisProduct.formInputs) {
        input.addEventListener('change', function () {
          thisProduct.processOrder();
        });
      }

      thisProduct.cartButton.addEventListener('click', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
    }

    processOrder() {
      const thisProduct = this;
      // console.log('processOrder:');

      // convert form objcet structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.form);
      // console.log('fromData:', formData);

      // set price to default price
      let price = thisProduct.data.price;

      // for every category (param)...
      for (let paramId in thisProduct.data.params) {
        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];
        // console.log(paramId, param); // nagłowki wyboru nazawa kategorii
        // console.log(param);

        // [ IN PROGRESS ] for every option in this category
        for (let optionId in param.options) {
          // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const option = param.options[optionId];
          // console.log(optionId, option); //opcje wyboru
          // console.log('option:', option);

          //check if there is param with a name of paramId in formData and if it includes optionId
          const optionSelected =
            formData[paramId] && formData[paramId].includes(optionId);

          if (optionSelected) {
            // check if the option is not default
            if (option && option.default != true) {
              // add option price to price variable
              price += option.price;
            }
          } else {
            // check if the option is default
            if (option && option.default === true) {
              // reduce price variable
              price -= option.price;
            }
          }
          // console.log('price:', price);

          const optionImage = thisProduct.imageWrapper.querySelector(
            '.' + paramId + '-' + optionId
          );

          if (optionImage) {
            if (optionSelected) {
              optionImage.classList.add(classNames.menuProduct.imageVisible);
            } else {
              optionImage.classList.remove(classNames.menuProduct.imageVisible);
            }
          }
        }
      }

      // update calculated price in the HTML
      thisProduct.priceSingle = price;

      /* multiply price by amount(ilość) */

      price *= thisProduct.amountWidget.value;
      thisProduct.priceElem.innerHTML = price; // to powiino byc w petli czy poza?
    }

    initAmountWidget() {
      // metoda odpowiedzialna za utworzenie nowej instancji klasy AmountWidget

      const thisProduct = this;

      //przekazujemy do konstruktora referencję do naszego diva z inputem i buttonami tak, jak oczekiwała na to klasa AmountWidget
      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);

      thisProduct.amountWidgetElem.addEventListener('updated', function () {
        thisProduct.processOrder();
      });
    }

    addToCart() {
      const thisProduct = this;
      app.cart.add(thisProduct.prepareCartProduct());
    }

    prepareCartProduct() {
      const thisProduct = this;

      const productSummary = {
        params: {},
      };
      productSummary.id = thisProduct.id;
      productSummary.name = thisProduct.data.name;
      productSummary.amount = thisProduct.amountWidget.value;
      productSummary.priceSingle = thisProduct.priceSingle; //cena jednostkowa
      productSummary.price =
        thisProduct.priceSingle * thisProduct.amountWidget.value;
      productSummary.params = thisProduct.prepareCartProductParams();

      return productSummary;
    }

    prepareCartProductParams() {
      const thisProduct = this;

      // convert form objcet structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.form);
      const params = {};
      // console.log('params', params);
      // console.log(thisProduct);

      // for every category (param)...
      for (let paramId in thisProduct.data.params) {
        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];

        // create category param in params const eg. params = { ingredients: { name: 'Ingredients', options: {}}}
        params[paramId] = {
          label: param.label,
          options: {},
        };

        // for every option in this category
        for (let optionId in param.options) {
          const option = param.options[optionId];
          const optionSelected =
            formData[paramId] && formData[paramId].includes(optionId);

          if (optionSelected) {
            params[paramId].options[optionId] = option.label;
          }
        }
      }

      return params;
    }
  }

  class AmountWidget {
    constructor(element) {
      //konstruktor oczekuje na jeden  element --> referencję do diva z inputem i buttonami
      //constructor ma referencję do diva z inputem i buttonami
      const thisWidget = this;

      // console.log('AmountWidget:', thisWidget);
      // console.log('constructor arguments:', element);

      thisWidget.getElements(element); //przekazanie zawartości tego argumentu konstruktora dalej... jako argument kolejnej metody getElements

      // thisWidget.setValue(
      //   thisWidget.input.value || settings.amountWidget.defaultValue
      // ); // zmiana z liniki wyzej chyba);
      thisWidget.setValue(settings.amountWidget.defaultValue);
      thisWidget.initActions(); //dobre mijece na wywołanie
    }

    getElements(element) {
      //przekazywanie tej metodzie argumentu element otrzymany przez konstruktor
      const thisWidget = this;

      thisWidget.element = element;

      thisWidget.input = thisWidget.element.querySelector(
        select.widgets.amount.input
      );
      thisWidget.linkDecrease = thisWidget.element.querySelector(
        select.widgets.amount.linkDecrease
      );
      thisWidget.linkIncrease = thisWidget.element.querySelector(
        select.widgets.amount.linkIncrease
      );
    }

    setValue(value) {
      //metoda
      const thisWidget = this;

      const newValue = parseInt(value); // parseInt --> konwerowanie liczby np ('3' -> 3 czyli stringa na number)

      /* TO DO: Add validation */

      // WARUENK !isNaN(newValue)// TAKI JEST  podreczniku

      // thisWidget.value zmieni tylko wtedy, jeśli nowa wpisana w input wartość będzie inna niż obecna.
      if (
        thisWidget.value !== newValue &&
        !isNaN(newValue) &&
        newValue <= settings.amountWidget.defaultMax &&
        newValue >= settings.amountWidget.defaultMin
      ) {
        // ja dałem taki warunek: "value != thisWidget.value" //
        thisWidget.value = newValue;
        thisWidget.announce();
      }

      //właściwość thisWidget.value
      thisWidget.input.value = thisWidget.value; //zapisuje we właściwości thisWidget.value wartość przekazanego argumentu, po przekonwertowaniu go na liczbę

      // thisWidget.input.value = thisWidget.value; //przypisanie wartości thisWidget.value do inputu,  aktualizuje wartość samego inputu
      // thisWidget.input.value = settings.amountWidget.defaultValue; // zmiana z liniki wyzej chyba
    }

    initActions() {
      const thisWidget = this;

      thisWidget.input.addEventListener('change', function (event) {
        event.preventDefault(); //to raczej nie potrzebne
        thisWidget.setValue(thisWidget.input.value);
      });

      thisWidget.linkDecrease.addEventListener('click', function (event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      });

      thisWidget.linkIncrease.addEventListener('click', function (event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1);
      });
    }

    announce() {
      const thisWidget = this;

      // const event = new Event('updated'); //zmienioza na linie nizej
      const event = new CustomEvent('updated', { bubbles: true });
      thisWidget.element.dispatchEvent(event);
    }
  }

  class Cart {
    //obsługuj kosz i jego wszystkie funkjonalności
    constructor(element) {
      const thisCart = this; //stosujemy stałą, w której zapisujemy obiekt this
      // console.log('thisCart', thisCart);

      thisCart.products = []; //przechowijemy tu produkty dodane do koszyka

      thisCart.getElements(element); // ??spytac jak działa co robi
      thisCart.initActions();

      // console.log('new cart', thisCart);
    }

    getElements(element) {
      const thisCart = this;

      thisCart.dom = {};

      thisCart.dom.wrapper = element;

      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(
        select.cart.toggleTrigger
      );
      thisCart.dom.productList = document.querySelector(
        select.cart.productList
      );
      thisCart.dom.deliveryFree = element.querySelector(
        select.cart.deliveryFee
      );
      thisCart.dom.subtotalPrice = element.querySelector(
        select.cart.subtotalPrice
      );
      thisCart.dom.totalPrice = element.querySelector(select.cart.totalPrice);
      thisCart.dom.totalNumber = element.querySelector(select.cart.totalNumber);

      thisCart.dom.form = element.querySelector(select.cart.form);

      thisCart.dom.phone = element.querySelector(select.cart.phone.value);
      thisCart.dom.address = element.querySelector(select.cart.address.value);
    }

    initActions() {
      const thisCart = this;

      thisCart.dom.toggleTrigger.addEventListener('click', function () {
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });

      thisCart.dom.productList.addEventListener('updated', function () {
        thisCart.update();
      });

      thisCart.dom.productList.addEventListener('remove', function (event) {
        thisCart.remove(event.detail.cartProduct);
      });

      thisCart.dom.form.addEventListener('submit', function (event) {
        event.preventDefault();
        thisCart.sendOrder();
      });
    }

    add(menuProduct) {
      const thisCart = this;

      // console.log('adding product', menuProduct);

      /* generate HTML based on template */
      const generateHTML = templates.cartProduct(menuProduct);
      // console.log(generateHTML);

      /* create element using  utils.createElementDOMFromHTML*/
      const generateDOM = utils.createDOMFromHTML(generateHTML);

      thisCart.dom.productList.appendChild(generateDOM);

      thisCart.products.push(new CartProduct(menuProduct, generateDOM));
      // console.log('thisCart.products', thisCart.products);

      // generateProduct();
      thisCart.update();
    }

    update() {
      const thisCart = this;

      const deliveryFree = settings.cart.defaultDeliveryFee;

      thisCart.totalNumber = 0; //odpowiada całościowej liczbie sztuk
      thisCart.subtotalPrice = 0; //odpowiad zsumowanej cenie za wszystko (chociaż bez kosztu dostawy)
      thisCart.totalPrice = 0; //nwm czy potrzebne

      for (let product of thisCart.products) {
        thisCart.totalNumber += product.amount;
        thisCart.subtotalPrice += product.price * product.amount;
      }

      if (thisCart.subtotalPrice != 0) {
        thisCart.totalPrice = thisCart.subtotalPrice + deliveryFree;
      }
      // console.log('------------------------------');
      // console.log('Cena za posiłek oprócz dostawy:', thisCart.subtotalPrice);
      // console.log('Cena za całe zamówienie:', thisCart.totalPrice);
      // console.log('------------------------------');

      thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;
      thisCart.dom.totalPrice.innerHTML = thisCart.totalPrice; // dolny total nie działa
      thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber; //nie działa
      thisCart.dom.deliveryFree.innerHTML = deliveryFree;

      console.log('TOTAL PRICE: ', thisCart.totalPrice);
      console.log('SUBTOTAL PRICE: ', thisCart.subtotalPrice);
      console.log('TOTAL NUMBER: ', thisCart.totalNumber);
    }

    remove(cartProduct) {
      const thisCart = this;

      const indexCartProduct = thisCart.products.indexOf(cartProduct);
      thisCart.products.splice(indexCartProduct, 1);

      cartProduct.dom.wrapper.remove();

      thisCart.update();
    }

    sendOrder() {
      const thisCart = this;

      const url = settings.db.url + '/' + settings.db.orders;

      const payload = {
        address: thisCart.dom.address,
        phone: thisCart.dom.phone,
        totalPrice: thisCart.totalPrice,
        subtotalPrice: thisCart.subtotalPrice,
        totalNumber: thisCart.totalNumber,
        deliveryFee: thisCart.deliveryFee,
        products: [],
      };
      console.log('payload:', payload);

      for (let prod of thisCart.products) {
        payload.products.push(prod.getData());
      }

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      };

      fetch(url, options);
    }
  }

  class CartProduct {
    constructor(menuProduct, element) {
      const thisCartProduct = this;
      // console.log('thisCartProduct', thisCartProduct);

      thisCartProduct.getElements(element);

      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.params = menuProduct.params;

      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();
    }

    getElements(element) {
      const thisCartProduct = this;

      thisCartProduct.dom = {};
      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWidget = element.querySelector(
        select.cartProduct.amountWidget
      );
      thisCartProduct.dom.price = element.querySelector(
        select.cartProduct.price
      );
      thisCartProduct.dom.edit = element.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove = element.querySelector(
        select.cartProduct.remove
      );
    }

    initAmountWidget() {
      //nie działą cena ilości
      const thisCartProduct = this;

      thisCartProduct.amountWidget = new AmountWidget(
        thisCartProduct.dom.amountWidget
      );

      thisCartProduct.dom.amountWidget.addEventListener('update', function () {
        thisCartProduct.amount = thisCartProduct.amountWidget.value;
        thisCartProduct.price =
          thisCartProduct.amount * thisCartProduct.priceSingle;

        thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
      });
    }

    remove() {
      const thisCartProduct = this;

      const event = new CustomEvent('remove', {
        bubbles: true,
        detail: { cartProduct: thisCartProduct },
      });

      thisCartProduct.dom.wrapper.dispatchEvent(event);
    }

    initActions() {
      const thisCartProduct = this;

      thisCartProduct.dom.edit.addEventListener('click', function (event) {
        event.preventDefault();
      });
      thisCartProduct.dom.remove.addEventListener('click', function (event) {
        event.preventDefault();
        thisCartProduct.remove();
      });

      console.log('remove', thisCartProduct.dom.remove);
    }

    getData() {
      const thisCartProduct = this;

      const productSummary = {};

      productSummary.id = thisCartProduct.id;
      productSummary.amount = thisCartProduct.amount;
      productSummary.price = thisCartProduct.price;
      productSummary.priceSingle = thisCartProduct.priceSingle;
      productSummary.name = thisCartProduct.name;
      productSummary.params = thisCartProduct.params;
    }
  }

  const app = {
    initMenu: function () {
      const thisApp = this;
      // console.log('thisApp.data', thisApp.data);

      for (let productData in thisApp.data.products) {
        new Product(
          thisApp.data.products[productData].id,
          thisApp.data.products[productData]
        );
      }
    },

    initData: function () {
      const thisApp = this;

      thisApp.data = {};
      const url = settings.db.url + '/' + settings.db.products;

      fetch(url)
        .then(function (rawResponse) {
          return rawResponse.json();
        })
        .then(function (parsedResponse) {
          console.log('parsedResponse:', parsedResponse);
          /* save parsedResponse as thisApp.data.products */
          thisApp.data.products = parsedResponse;

          /* execute initMenu method */
          thisApp.initMenu();
        });
    },

    init: function () {
      const thisApp = this;
      console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates);
      thisApp.initData();

      thisApp.initCart();
    },

    initCart: function () {
      const thisApp = this;
      // console.log('thisApp', thisApp);

      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    },
  };

  app.init();
}
