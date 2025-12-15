class PlatziReactive {
  deps = new Map();

  constructor(options) {
    this.origen = options.data();
    const self = this;

    this.$data = new Proxy(this.origen, {
      get(target, name) {
        if (Reflect.has(target, name)) {
          return Reflect.get(target, name);
        }
        console.warn("La propiedad", name, "no existe");
        return "";
      },
      set(target, name, value) {
        const result = Reflect.set(target, name, value);
        self.trigger(name);
        return result;
      },
    });
  }

  // Permite registrar múltiples efectos por una misma propiedad (esencial para p-bind)
  trackEffect(name, effect) {
    if (!this.deps.has(name)) {
      this.deps.set(name, new Set());
    }
    this.deps.get(name).add(effect);
  }

  trigger(name) {
    const effects = this.deps.get(name);
    if (effects) {
      effects.forEach((effect) => effect());
    }
  }

  mount() {
    // p-text
    document.querySelectorAll("*[p-text]").forEach((el) => {
      const name = el.getAttribute("p-text");
      this.pText(el, this.$data, name);
      this.trackEffect(name, () => this.pText(el, this.$data, name));
    });

    // p-model
    document.querySelectorAll("*[p-model]").forEach((el) => {
      const name = el.getAttribute("p-model");
      this.pModel(el, this.$data, name);

      el.addEventListener("input", () => {
        Reflect.set(this.$data, name, el.value);
      });
    });

    // p-bind (SOLUCIÓN DEL CURSO)
    document.querySelectorAll("*[p-bind]").forEach((Element) => {
      let [Atributo, Valor] = Element.getAttribute("p-bind").split(":");

      this.pBind(Element, this.$data, Atributo, Valor);

      // Valor es la propiedad en data (ej: 'image'), Atributo es el atributo HTML (ej: 'src')
      this.trackEffect(Valor, () =>
        this.pBind(Element, this.$data, Atributo, Valor)
      );
    });
  }

  pText(el, target, name) {
    el.innerText = Reflect.get(target, name);
  }

  pModel(el, target, name) {
    el.value = Reflect.get(target, name);
  }

  // Método pBind()
  pBind(element, origin, attribute, value) {
    element.setAttribute(attribute, Reflect.get(origin, value));
  }
}

var Platzi = {
  createApp(options) {
    return new PlatziReactive(options);
  },
};
