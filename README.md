# Kids House · Portal de familias

Maqueta navegable del portal de familias. El mismo ingreso simulado permite probar el acceso de la dueña y tres familias ficticias. Cada familia ve el nombre de un niño o niña, su curso y la jornada de ese curso. El visor incluye siete escenas de demostración, una vista individual y controles de reproducción.

## Ver en local

Sirve la carpeta que contiene `index.html` con `python3 -m http.server 8804`. GitHub Pages publica esa misma carpeta tal como está.

En la pantalla de ingreso, usa los botones de ejemplo para cargar una cuenta ficticia. El navegador guarda la sesión de prueba en la pestaña y la borra al cerrar sesión.

La página `en-vivo.html` admite un enlace privado firmado para abrir el visor real dentro de GitHub Pages. El visor pide una cuenta de prueba y verifica la sesión en el servidor para cada solicitud de video.

## Administración de demostración

Con la cuenta de la dueña, crea una jornada, asígnala a un curso, registra a un niño o niña en ese curso y vincula a un apoderado. Entra luego con la cuenta de ese apoderado para comprobar que recibe la jornada del curso y el acceso de lunes a viernes, en hora de Santiago. Usa datos ficticios. Las altas de esta maqueta se guardan en el navegador en que se crean.

## Visuales

La portada muestra una extensión panorámica del mural creada con ImageGen en `assets/mural-portada.jpg`. En pantallas estrechas usa la fotografía proporcionada con un ajuste de luz y color en `assets/mural.jpg`. ImageGen también generó las escenas ficticias, que se animaron para probar el visor. Las fuentes Bricolage Grotesque y Nunito Sans se distribuyen con sus licencias en `assets/`.

<details>
<summary>Extensión panorámica del mural</summary>

Use case: compositing. Make a single wide landscape background artwork, ideally 16:9, for the full-bleed homepage of the real Chilean daycare Kids House. This is an outpainting of the single attached picture of their actual painted sign on a warm cream stucco wall. It is the same continuous stucco wall at the same scale and brightness. No frames, photographs in frames, panels, outlines around the photo, borders, buttons, UI, or screenshots. Extend the physical wall substantially to the LEFT so its left 44% through the upper 83% is quiet blank warm ivory cream wall with a very subtle even stucco texture for actual HTML headings and a dark-green login form later. Put the attached painting in the RIGHT half with its unchanged logo art centered around x=73%, y=47%. Maintain the exact existing designed colored letters and house-shaped O with heart. Its ONLY text is the exact trademark painting from the reference: “GUARDERÍA INTEGRAL” arced above, “KIDS” and “HOUSE” on their respective lines, and “AFTER SCHOOL” arced below. Keep enough space around the complete text, sun rays and logo. Copy the source logo as closely as possible, with existing green, mustard, muted coral, warm blush, and the organic hand-painted contours. Reposition the sun just enough so that it is comfortably above and to the right of the region reserved for the login form. Let the lush overlapping broad rounded painted mustard, muted pink, sage and deep botanical green hills flow all the way across the bottom edge, including under the bottom left; keep the hills mostly within the lowest 13% in the left half, rising organically higher near the right where they are part of the original mural. One or two painted dark botanical sprigs, attached to the hills at the far left edge and in the lower right, with the exact simple rounded leaf silhouettes of the reference, add beautiful scale and character. Allow one subtle tiny painted sage cloud only above or toward the far right of the logo, as in the reference. Clear soft wall at the entire left-center, all other visual drama concentrated at right and bottom; clear wall reaches the top edge for header continuity. Cheerful, bright natural cream, sophisticated restraint, real tactile mineral plaster and matte painted pigments with authentic warm tones from the reference. Looks like walking up to the Kids House mural. No vignette, cast shadows, angle distortion, people, lawn, room, signage hardware, extra words or text, no watermark. Produce crisp high quality landscape art filling the canvas without margins.

</details>

<details>
<summary>Ajuste de la luz y el color del mural</summary>

Use case: precise-object-edit. Edit only the photographic color and exposure of the provided direct photograph of the real hand-painted Kids House mural. Keep the framing, perspective, every painted border, the heart and house-shaped O, sun, hills, leaves, natural stucco marks, and especially ALL existing lettering COMPLETELY intact. The real lettering reads GUARDERÍA INTEGRAL / KIDS HOUSE / AFTER SCHOOL. Preserve the existing positions, angles, shapes, and original spelling exactly, with no redraw, no graphic replacement, no re-typesetting, and no additions. This is photographic color grading for the actual reference photograph, not a new illustration. Lift midtones to make the photo feel a little brighter and sunnier, gently warm the wall's white balance to an inviting warm off-white, make the existing forest teal and sage greener and somewhat more vibrant, bring out the existing raspberry coral and honey mustard. Use a tasteful natural boost, keeping the pigment tactile and the real stucco visible. Preserve the whole input composition and original crop, no new objects or people, no smoothing, no watermark.

</details>

<details>
<summary>Escenas de demostración</summary>

Use case: photorealistic-natural. Asset type: portrait photo contact sheet for eight tiles of an illustrative daycare camera dashboard. Create ONE image which is a mathematically regular 2 columns by 4 rows edge-to-edge grid of 8 equally sized WIDE landscape photographs. The overall image ratio is portrait 2:3. The straight seam is at exactly x=50%, horizontal seams every 25% of the image height. NO gaps, borders, separators, overlay, lettering, captions, timestamps, graphics or logos. Each tile is a clearly different original empty space from a fictional cozy small Chilean childcare center, pale ivory stucco and playful mural accents of sage teal, apricot, warm yellow and dusty coral, realistic lightly muted but bright daylight, like crisp shot from a relaxed-wide slightly elevated wall vantage. The order matters, top to bottom and left to right: 1 covered entry with colorful abstract white walls, curved arch and wooden door, 2 large turf courtyard with a mint/coral semicircle mural and small orange slide, 3 little garden with raised beds and herb planters, 4 covered terrace with child-sized tables under pergola and peach mural, 5 indoor playroom with low storage and blocks, 6 calm reading and arts room with books and two small desks, 7 indoor connecting corridor with arch and a gentle sun mural, 8 original warm daycare playground with a swing and garden. Each photograph fills its exact tile, as seven readable standalone thumbnail artworks. NO children, NO adults, NO pets, NO real addresses, NO security device or sensitive layout, no brand text. Natural materials. Clean inviting compositions, atmospheric, a cohesive but varied set.

</details>
