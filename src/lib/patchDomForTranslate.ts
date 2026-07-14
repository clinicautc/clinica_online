/**
 * ============================================================================
 * ARCHIVO: patchDomForTranslate.ts
 * PROPÓSITO: Evitar el crash "insertBefore/removeChild NotFoundError" que
 * ocurre cuando el traductor automático del navegador (Chrome/Firefox/Edge)
 * reordena o envuelve nodos de texto por fuera de React. Cuando eso pasa, el
 * DOM real ya no coincide con lo que React cree tener, y su intento de
 * remover/insertar un nodo de referencia que ya no es hijo directo lanza una
 * excepción que tumba toda la app. Es un problema conocido y sin solución
 * oficial de React (facebook/react#11538) — la mitigación estándar es hacer
 * que esas dos operaciones del DOM toleren la discrepancia en vez de tronar,
 * sin desactivar la traducción (el usuario debe poder traducir la página).
 * ============================================================================
 */

export function patchDomForTranslate() {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) {
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(this: Node, newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return this.appendChild(newNode) as T;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}
