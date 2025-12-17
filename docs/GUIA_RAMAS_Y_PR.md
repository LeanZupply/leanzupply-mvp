# Guia de Ramas y Pull Requests

## Que es una Rama (Branch)?

Imagina que el codigo de tu aplicacion es como un documento de Word. La rama **main** (principal) es la version oficial que esta en produccion - la que ven tus usuarios.

Cuando queremos hacer cambios, en lugar de editar directamente el documento oficial, hacemos una **copia** para trabajar. Esa copia es una **rama**.

```
main (produccion)
  |
  +-- feature/landing-page-updates (nuestra copia de trabajo)
```

**Ventajas:**
- Si algo sale mal, el original (main) no se afecta
- Puedes revisar los cambios antes de aplicarlos
- Multiples personas pueden trabajar en diferentes ramas sin interferir

---

## Que es un Pull Request (PR)?

Un Pull Request es una **solicitud formal** para incorporar los cambios de tu rama al codigo principal.

Piensa en ello como enviar un documento para revision antes de publicarlo oficialmente.

**El proceso es:**

1. **Creas la rama** - Tu copia de trabajo
2. **Haces los cambios** - Editas el codigo
3. **Creas el PR** - Solicitas que revisen tus cambios
4. **Revision** - Alguien revisa y aprueba (o pide correcciones)
5. **Merge** - Los cambios se incorporan a main

---

## Como Revisar un Pull Request

Cuando recibas un link a un PR, veras:

### Pestana "Files changed"
Aqui puedes ver exactamente que se modifico:
- **Lineas en verde** = codigo agregado
- **Lineas en rojo** = codigo eliminado

### Pestana "Conversation"
Aqui puedes:
- Leer un resumen de los cambios
- Dejar comentarios o preguntas
- Aprobar o solicitar cambios

### Botones de accion
- **"Approve"** - Aprobar los cambios
- **"Request changes"** - Pedir modificaciones
- **"Merge"** - Incorporar los cambios a produccion (solo despues de aprobar)

---

## Flujo Visual

```
Tu solicitas cambios
        |
        v
Desarrollador crea rama
        |
        v
Desarrollador hace cambios
        |
        v
Desarrollador crea PR
        |
        v
TU REVISAS EL PR  <-- Estas aqui
        |
        v
Apruebas o pides cambios
        |
        v
Se hace "Merge" a main
        |
        v
Cambios en produccion
```

---

## Preguntas Frecuentes

**Puedo ver los cambios antes de aprobar?**
Si, en la pestana "Files changed" ves exactamente que se modifico.

**Que pasa si no me gustan los cambios?**
Puedes dejar un comentario explicando que quieres diferente. El desarrollador hara los ajustes y actualizara el PR.

**Los cambios afectan la pagina en vivo?**
No, hasta que no se haga "Merge". Mientras tanto, la pagina sigue funcionando con el codigo anterior.

**Puedo probar los cambios antes de aprobar?**
Si, se puede configurar un "entorno de preview" donde ves como quedaria antes de publicar.

---

## Glosario

| Termino | Significado |
|---------|-------------|
| **Branch/Rama** | Copia del codigo para trabajar sin afectar produccion |
| **Main** | La rama principal, el codigo en produccion |
| **Commit** | Guardar un conjunto de cambios con una descripcion |
| **Pull Request (PR)** | Solicitud para revisar e incorporar cambios |
| **Merge** | Incorporar los cambios de una rama a otra |
| **Review** | Proceso de revision de un PR |
| **Approve** | Dar el visto bueno a los cambios |
