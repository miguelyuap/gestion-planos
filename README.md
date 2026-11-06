# GST-PLANOS 3D — Estudio CAD Paramétrico de Estructuras y Mobiliario

Aplicación web desarrollada bajo los estándares oficiales de **GST-SOFTWARE** para la generación de **planos en 3D acotados en tiempo real** a partir de requerimientos en lenguaje natural (*"voy a hacer un techo"*, *"quiero un closet"*, *"mueble de cocina"*, *"mesa"*, *"puerta"*, *"marco"*) y parámetros de medidas exactas.

---

## Características Principales

1. **Intérprete de Requerimientos en Lenguaje Natural (`intent-parser`):**
   - Detecta automáticamente el tipo de estructura y las medidas ingresadas por el usuario en metros (`m`), centímetros (`cm`) o milímetros (`mm`).
2. **Catálogo Multi-Estructura (6 Motores Paramétricos):**
   - **Techos y Cubiertas (`roof`):** A dos aguas, a un agua y pérgolas con cálculo trigonométrico de cumbrera, columnas, vigas soleras, cerchas, correas y faldones.
   - **Mesas y Escritorios (`table`):** Tablero superior, 4 patas estructurales, faldones perimetrales y repisa inferior opcional.
   - **Muebles de Cocina (`kitchen_cabinet`):** Módulo con costados, zócalo, división interna, entrepaños, puertas batientes, gavetas/cajones y mesón con salpicadero.
   - **Closets y Armarios (`closet`):** Múltiples cuerpos verticales (2 a 4 cuerpos), maletero superior, barras colgadoras cromadas, cajonera central, entrepaños y puertas.
   - **Puertas con Marco (`door`):** Jambas laterales, cabezal, chambranas/tapajuntas, hoja lisa / entablerada / con visor de vidrio, herraje y apertura interactiva.
   - **Marcos y Bastidores (`frame`):** Perfiles perimetrales, parales verticales, travesaños horizontales y panel/vidrio interior.
3. **Visor CAD 3D Interactivo (`BlueprintCanvas`):**
   - Renderizado WebGL con **Three.js** + bordes técnicos CAD (`EdgesGeometry`).
   - **Cotas 3D Dinámicas** proyectadas en tiempo real.
   - **Vistas Técnicas:** `3D Iso`, `Frontal (Alzado)`, `Lateral (Corte)` y `Planta (Superior)`.
   - **Herramientas de Inspección:** Modo `Rayos X / Estructura`, `Abrir/Cerrar Puertas y Cajones`, `Vista Explotada 3D` y selección individual de piezas por clic para consultar medidas exactas de corte.
4. **Ficha Técnica y Despiece de Materiales (`CutListModal`):**
   - Agrupación automática de piezas con código, cantidad, medidas exactas de corte y exportación/impresión a PDF.

---

## Comandos de Desarrollo

```bash
npm install
npm run dev
npm run typecheck
npm run test
npm run build
```
