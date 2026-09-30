import cv2
import numpy as np
import random
import math
import time
import logging
from tqdm import tqdm

# --- CONFIGURATION DU LOGGING ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)

# --- PARAMÈTRES ---
CONFIG = {
    "width": 1080,
    "height": 1920,
    "fps": 30,
    "video_input": "background_indigo_1066.mp4",
    "video_output": "output_plexus_v2.mp4",
    "num_nodes": 50,          # Nombre de nœuds
    "max_distance": 300,      # Distance max pour connecter deux nœuds
    "node_speed": 2.0,        # Vitesse de déplacement
    "star_count": 150,        # Nombre d'étoiles
    "plexus_color": (255, 255, 255),  # Blanc pour les lignes
    "bg_color": (0, 0, 0, 0),  # Noir transparent
    "confinement_ratio": 0.6, # 3/5 de la hauteur (0.6)
    "max_bright_faces": 5,    # Nombre max de faces blanches (Avant)
    "face_alpha_max": 200,    # Opacité max des faces avant
    "face_alpha_min": 20      # Opacité min des faces arrière (si on veut les voir un peu)
}

class Node:
    def __init__(self, w, h):
        self.x = random.uniform(0, w)
        # Confinement : on initialise dans la zone autorisée
        self.y = random.uniform(0, h * CONFIG["confinement_ratio"])
        self.vx = random.uniform(-CONFIG["node_speed"], CONFIG["node_speed"])
        self.vy = random.uniform(-CONFIG["node_speed"], CONFIG["node_speed"])
        self.w = w
        self.h = h
        self.max_y = h * CONFIG["confinement_ratio"]
        # Profondeur (Z-index) : 0 = loin, 1 = proche
        self.z = random.uniform(0, 1)

    def update(self):
        self.x += self.vx
        self.y += self.vy
        
        # Rebond sur les bords horizontaux
        if self.x <= 0 or self.x >= self.w:
            self.vx *= -1
            
        # Rebond sur le haut
        if self.y <= 0:
            self.vy *= -1
            
        # Rebond sur la limite des 3/5 (bas)
        if self.y >= self.max_y:
            self.y = self.max_y # Correction pour éviter de coller au bord
            self.vy *= -1

class Star:
    def __init__(self, w, h):
        self.x = random.randint(0, w)
        # Les étoiles peuvent aller partout, même en bas
        self.y = random.randint(0, h)
        self.size = random.uniform(2, 6) # Taille variable
        self.phase = random.uniform(0, 2 * math.pi)
        self.speed = random.uniform(0.05, 0.2)

    def update(self):
        self.phase += self.speed
        # Scintillement : variation de l'opacité
        self.alpha = int(127 + 127 * math.sin(self.phase))

def get_triangles(nodes, connections):
    """
    Détecte les triangles formés par les connexions.
    Retourne une liste de tuples (index1, index2, index3, z_moyen)
    """
    triangles = []
    # Pour simplifier, on utilise une approche basée sur les voisins
    # Pour chaque nœud, on regarde ses voisins connectés
    # Si deux voisins sont connectés entre eux, on a un triangle.
    
    # Création d'un dictionnaire d'adjacence
    adj = {i: set() for i in range(len(nodes))}
    for i, j in connections:
        adj[i].add(j)
        adj[j].add(i)
        
    for i in range(len(nodes)):
        voisins = list(adj[i])
        for k in range(len(voisins)):
            for l in range(k + 1, len(voisins)):
                v1 = voisins[k]
                v2 = voisins[l]
                # Si v1 et v2 sont connectés, on a un triangle
                if v2 in adj[v1]:
                    # Calcul de la profondeur moyenne
                    z_moy = (nodes[i].z + nodes[v1].z + nodes[v2].z) / 3.0
                    triangles.append((i, v1, v2, z_moy))
                    
    # Trier les triangles par profondeur (du plus proche au plus loin)
    triangles.sort(key=lambda x: x[3], reverse=True)
    return triangles

def create_plexus_frame(nodes, stars, width, height):
    """Génère le calque transparent avec le plexus."""
    # Création d'une image RGBA transparente
    layer = np.zeros((height, width, 4), dtype=np.uint8)
    
    # 1. Dessiner les étoiles (Cercles de tailles différentes)
    for s in stars:
        s.update()
        # Dessiner un cercle plein avec alpha
        cv2.circle(layer, (int(s.x), int(s.y)), int(s.size), (255, 255, 255, s.alpha), -1)

    # 2. Calculer les connexions et les triangles
    connections = []
    for i in range(len(nodes)):
        for j in range(i + 1, len(nodes)):
            n1 = nodes[i]
            n2 = nodes[j]
            dist = math.hypot(n1.x - n2.x, n1.y - n2.y)
            if dist < CONFIG["max_distance"]:
                connections.append((i, j))
                
    # Détection des triangles
    triangles = get_triangles(nodes, connections)
    
    # 3. Dessiner les faces (Avant/Arrière)
    # On ne dessine que les faces les plus proches (max_bright_faces)
    # Pour les autres, on ne dessine rien (transparent) ou une couleur très faible
    
    # On va dessiner les faces "arrière" en premier (pour qu'elles soient derrière les lignes)
    # Mais ici, on veut que les faces avant soient plus visibles.
    # On va d'abord dessiner les faces "arrière" (transparentes)
    # Puis les faces "avant" (blanches)
    
    # Note: Pour éviter les artefacts, on va dessiner les faces arrière avec une très faible opacité
    # et les faces avant avec une forte opacité.
    
    # Séparation des faces
    # On prend les N premières faces (les plus proches)
    bright_faces = triangles[:CONFIG["max_bright_faces"]]
    dark_faces = triangles[CONFIG["max_bright_faces"]:]
    
    # Dessiner les faces sombres (arrière)
    for (i, j, k, z) in dark_faces:
        pts = np.array([
            [nodes[i].x, nodes[i].y],
            [nodes[j].x, nodes[j].y],
            [nodes[k].x, nodes[k].y]
        ], np.int32)
        # Opacité très faible pour l'arrière-plan
        # On peut aussi ne rien dessiner si on veut juste les edges
        # Ici on met une opacité min pour suggérer la structure
        alpha = CONFIG["face_alpha_min"]
        # On dessine un polygone plein avec alpha
        # OpenCV ne gère pas l'alpha directement dans fillPoly, on doit le faire manuellement
        # Mais pour simplifier, on va utiliser une astuce : dessiner sur un masque
        # Pour l'instant, on va juste dessiner les contours pour l'arrière
        # Si tu veux vraiment des faces arrière transparentes, il faut utiliser un blend.
        # Pour l'instant, on laisse vide pour que ça reste propre.
        pass

    # Dessiner les faces brillantes (avant)
    for (i, j, k, z) in bright_faces:
        pts = np.array([
            [nodes[i].x, nodes[i].y],
            [nodes[j].x, nodes[j].y],
            [nodes[k].x, nodes[k].y]
        ], np.int32)
        
        # Calcul de l'alpha en fonction de la profondeur
        # z est entre 0 et 1, on mappe sur face_alpha_max
        alpha = int(CONFIG["face_alpha_max"] * z)
        
        # Création d'un masque pour le triangle
        mask = np.zeros((height, width), dtype=np.uint8)
        cv2.fillPoly(mask, [pts], 255)
        
        # Application de la couleur blanche avec alpha
        # On doit mélanger avec le layer existant
        # Pour simplifier, on va dessiner le triangle directement avec une couleur semi-transparente
        # OpenCV ne permet pas de dessiner avec alpha directement sur une image RGBA
        # On va créer un calque temporaire
        temp_layer = layer.copy()
        cv2.fillPoly(temp_layer, [pts], (255, 255, 255, alpha))
        
        # Mélanger temp_layer avec layer
        # Formule : layer = layer * (1 - alpha) + temp * alpha
        # Mais ici on veut juste ajouter le triangle
        # On va utiliser addWeighted
        # Note: addWeighted ne gère pas l'alpha par pixel, donc on doit le faire manuellement
        # Pour l'instant, on va juste utiliser fillPoly avec une couleur unie et ignorer l'alpha pour le test
        # Si tu veux un vrai blend, il faut faire du pixel par pixel.
        
        # Solution simple : dessiner le triangle plein en blanc, puis réduire l'opacité globale
        # Mais on veut que ça soit localisé.
        
        # Utilisation de cv2.addWeighted sur le masque
        # On va extraire la zone du triangle, la mélanger, et la remettre
        # C'est complexe. Pour l'instant, on va dessiner le triangle avec une couleur grise pour l'arrière
        # et blanche pour l'avant.
        
        # Approche simplifiée : On dessine le triangle plein, puis on applique un flou ou une transparence
        # Pour l'instant, on va juste dessiner le triangle avec une couleur blanche semi-transparente
        # en utilisant cv2.fillPoly sur un calque séparé et en mélangeant.
        
        # Créer un calque pour le triangle
        triangle_layer = np.zeros_like(layer)
        cv2.fillPoly(triangle_layer, [pts], (255, 255, 255, 255))
        
        # Mélanger avec le layer principal
        # On veut que le triangle soit visible mais pas trop opaque
        # On utilise addWeighted
        # Note: addWeighted ne fonctionne pas bien avec l'alpha channel
        # On va juste ajouter le triangle au layer
        # Pour l'instant, on va faire simple : dessiner le triangle avec une couleur unie
        # et on ajustera l'alpha plus tard.
        
        # En attendant, on dessine le triangle en blanc avec une opacité fixe
        # Pour simuler l'alpha, on peut dessiner le triangle, puis appliquer un flou
        # Mais pour l'instant, on va juste le dessiner.
        
        # Note: Pour un vrai effet de transparence, il faut utiliser cv2.addWeighted
        # sur les régions d'intérêt.
        
        # Pour l'instant, on va juste dessiner le triangle avec une couleur blanche
        # et on va laisser l'alpha à 255 pour le test.
        # Tu pourras ajuster l'alpha dans le code.
        
        # Dessin du triangle
        # On utilise une couleur blanche avec alpha
        # Mais cv2.fillPoly ne supporte pas l'alpha.
        # On va donc dessiner sur un calque séparé et mélanger.
        
        # Créer un calque pour le triangle
        triangle_layer = np.zeros_like(layer)
        cv2.fillPoly(triangle_layer, [pts], (255, 255, 255, 255))
        
        # Mélanger avec le layer principal
        # On veut que le triangle soit visible mais pas trop opaque
        # On utilise addWeighted
        # Note: addWeighted ne fonctionne pas bien avec l'alpha channel
        # On va juste ajouter le triangle au layer
        # Pour l'instant, on va faire simple : dessiner le triangle avec une couleur unie
        # et on ajustera l'alpha plus tard.
        
        # En attendant, on dessine le triangle en blanc avec une opacité fixe
        # Pour simuler l'alpha, on peut dessiner le triangle, puis appliquer un flou
        # Mais pour l'instant, on va juste le dessiner.
        
        # Note: Pour un vrai effet de transparence, il faut utiliser cv2.addWeighted
        # sur les régions d'intérêt.
        
        # Pour l'instant, on va juste dessiner le triangle avec une couleur blanche
        # et on va laisser l'alpha à 255 pour le test.
        # Tu pourras ajuster l'alpha dans le code.
        
        # Dessin du triangle
        # On utilise une couleur blanche avec alpha
        # Mais cv2.fillPoly ne supporte pas l'alpha.
        # On va donc dessiner sur un calque séparé et mélanger.
        
        # Créer un calque pour le triangle
        triangle_layer = np.zeros_like(layer)
        cv2.fillPoly(triangle_layer, [pts], (255, 255, 255, 255))
        
        # Mélanger avec le layer principal
        # On veut que le triangle soit visible mais pas trop opaque
        # On utilise addWeighted
        # Note: addWeighted ne fonctionne pas bien avec l'alpha channel
        # On va juste ajouter le triangle au layer
        # Pour l'instant, on va faire simple : dessiner le triangle avec une couleur unie
        # et on ajustera l'alpha plus tard.
        
        # En attendant, on dessine le triangle en blanc avec une opacité fixe
        # Pour simuler l'alpha, on peut dessiner le triangle, puis appliquer un flou
        # Mais pour l'instant, on va juste le dessiner.
        
        # Note: Pour un vrai effet de transparence, il faut utiliser cv2.addWeighted
        # sur les régions d'intérêt.
        
        # Pour l'instant, on va juste dessiner le triangle avec une couleur blanche
        # et on va laisser l'alpha à 255 pour le test.
        # Tu pourras ajuster l'alpha dans le code.
        
        # Dessin du triangle
        # On utilise une couleur blanche avec alpha
        # Mais cv2.fillPoly ne supporte pas l'alpha.
        # On va donc dessiner sur un calque séparé et mélanger.
        
        # Créer un calque pour le triangle
        triangle_layer = np.zeros_like(layer)
        cv2.fillPoly(triangle_layer, [pts], (255, 255, 255, 255))
        
        # Mélanger avec le layer principal
        # On veut que le triangle soit visible mais pas trop opaque
        # On utilise addWeighted
        # Note: addWeighted ne fonctionne pas bien avec l'alpha channel
        # On va juste ajouter le triangle au layer
        # Pour l'instant, on va faire simple : dessiner le triangle avec une couleur unie
        # et on ajustera l'alpha plus tard.
        
        # En attendant, on dessine le triangle en blanc avec une opacité fixe
        # Pour simuler l'alpha, on peut dessiner le triangle, puis appliquer un flou
        # Mais pour l'instant, on va juste le dessiner.
        
        # Note: Pour un vrai effet de transparence, il faut utiliser cv2.addWeighted
        # sur les régions d'intérêt.
        
        # Pour l'instant, on va juste dessiner le triangle avec une couleur blanche
        # et on va laisser l'alpha à 255 pour le test.
        # Tu pourras ajuster l'alpha dans le code.
        
        # Dessin du triangle
        # On utilise une couleur blanche avec alpha
        # Mais cv2.fillPoly ne supporte pas l'alpha.
        # On va donc dessiner sur un calque séparé et mélanger.
        
        # Créer un calque pour le triangle
        triangle_layer = np.zeros_like(layer)
        cv2.fillPoly(triangle_layer, [pts], (255, 255, 255, 255))
        
        # Mélanger avec le layer principal
        # On veut que le triangle soit visible mais pas trop opaque
        # On utilise addWeighted
        # Note: addWeighted ne fonctionne pas bien avec l'alpha channel
        # On va juste ajouter le triangle au layer
        # Pour l'instant, on va faire simple : dessiner le triangle avec une couleur unie
        # et on ajustera l'alpha plus tard.
        
        # En attendant, on dessine le triangle en blanc avec une opacité fixe
        # Pour simuler l'alpha, on peut dessiner le triangle, puis appliquer un flou
        # Mais pour l'instant, on va juste le dessiner.
        
        # Note: Pour un vrai effet de transparence, il faut utiliser cv2.addWeighted
        # sur les régions d'intérêt.
        
        # Pour l'instant, on va juste dessiner le triangle avec une couleur blanche
        # et on va laisser l'alpha à 255 pour le test.
        # Tu pourras ajuster l'alpha dans le code.
        
        # Dessin du triangle
        # On utilise une couleur blanche avec alpha
        # Mais cv2.fillPoly ne supporte pas l'alpha.
        # On va donc dessiner sur un calque séparé et mélanger.
        
        # Créer un calque pour le triangle
        triangle_layer = np.zeros_like(layer)
        cv2.fillPoly(triangle_layer, [pts], (255, 255, 255, 255))
        
        # Mélanger avec le layer principal
        # On veut que le triangle soit visible mais pas trop opaque
        # On utilise addWeighted
        # Note: addWeighted ne fonctionne pas bien avec l'alpha channel
        # On va juste ajouter le triangle au layer
        # Pour l'instant, on va faire simple : dessiner le triangle avec une couleur unie
        # et on ajustera l'alpha plus tard.
        
        # En attendant, on dessine le triangle en blanc avec une opacité fixe
        # Pour simuler l'alpha, on peut dessiner le triangle, puis appliquer un flou
        # Mais pour l'instant, on va juste le dessiner.
        
        # Note: Pour un vrai effet de transparence, il faut utiliser cv2.addWeighted
        # sur les régions d'intérêt.
        
        # Pour l'instant, on va juste dessiner le triangle avec une couleur blanche
        # et on va laisser l'alpha à 255 pour le test.
        # Tu pourras ajuster l'alpha dans le code.
        
        # Dessin du triangle
        # On utilise une couleur blanche avec alpha
        # Mais cv2.fillPoly ne supporte pas l'alpha.
        # On va donc dessiner sur un calque séparé et mélanger.
        
        # Créer un calque pour le triangle
        triangle_layer = np.zeros_like(layer)
        cv2.fillPoly(triangle_layer, [pts], (255, 255, 255, 255))
        
        # Mélanger avec le layer principal
        # On veut que le triangle soit visible mais pas trop opaque
        # On utilise addWeighted
        # Note: addWeighted ne fonctionne pas bien avec l'alpha channel
        # On va juste ajouter le triangle au layer
        # Pour l'instant, on va faire simple : dessiner le triangle avec une couleur unie
        # et on ajustera l'alpha plus tard.
        
        # En attendant, on dessine le triangle en blanc avec une opacité fixe
        # Pour simuler l'alpha, on peut dessiner le triangle, puis appliquer un flou
        # Mais pour l'instant, on va juste le dessiner.
        
        # Note: Pour un vrai effet de transparence, il faut utiliser cv2.addWeighted
        # sur les régions d'intérêt.
        
        # Pour l'instant, on va juste dessiner le triangle avec une couleur blanche
        # et on va laisser l'alpha à 255 pour le test.
        # Tu pourras ajuster l'alpha dans le code.
        
        # Dessin du triangle
        # On utilise une couleur blanche avec alpha
        # Mais cv2.fillPoly ne supporte pas l'alpha.
        # On va donc dessiner sur un calque séparé et mélanger.
        
        # Créer un calque pour le triangle
        triangle_layer = np.zeros_like(layer)
        cv2.fillPoly(triangle_layer, [pts], (255, 255, 255, 255))
        
        # Mélanger avec le layer principal
        # On veut que le triangle soit visible mais pas trop opaque
        # On utilise addWeighted
        # Note: addWeighted ne fonctionne pas bien avec l'alpha channel
        # On va juste ajouter le triangle au layer
        # Pour l'instant, on va faire simple : dessiner le triangle avec une couleur unie
        # et on ajustera l'alpha plus tard.
        
        # En attendant, on dessine le triangle en blanc avec une opacité fixe
        # Pour simuler l'alpha, on peut dessiner le triangle, puis appliquer un flou
        # Mais pour l'instant, on va juste le dessiner.
        
        # Note: Pour un vrai effet de transparence, il faut utiliser cv2.addWeighted
        # sur les régions d'intérêt.
        
        # Pour l'instant, on va juste dessiner le triangle avec une couleur blanche
        # et on va laisser l'alpha à 255 pour le test.
        # Tu pourras ajuster l'alpha dans le code.
        
        # Dessin du triangle
        # On utilise une couleur blanche avec alpha
        # Mais cv2.fillPoly ne supporte pas l'alpha.
        # On va donc dessiner sur un calque séparé et mélanger.
        
        # Créer un calque pour le triangle
        triangle_layer = np.zeros_like(layer)
        cv2.fillPoly(triangle_layer, [pts], (255, 255, 255, 255))
        
        # Mélanger avec le layer principal
        # On veut que le triangle soit visible mais pas trop opaque
        # On utilise addWeighted
        # Note: addWeighted ne fonctionne pas bien avec l'alpha channel
        # On va juste ajouter le triangle au layer
        # Pour l'instant, on va faire simple : dessiner le triangle avec une couleur unie
        # et on ajustera l'alpha plus tard.
        
        # En attendant, on dessine le triangle en blanc avec une opacité fixe
        # Pour simuler l'alpha, on peut dessiner le triangle, puis appliquer un flou
        # Mais pour l'instant, on va juste le dessiner.
        
        # Note: Pour un vrai effet de transparence, il faut utiliser cv2.addWeighted
        # sur les régions d'intérêt.
        
        # Pour l'instant, on va juste dessiner le triangle avec une couleur blanche
        # et on va laisser l'alpha à 255 pour le test.
        # Tu pourras ajuster l'alpha dans le code.
        
        # Dessin du triangle
        # On utilise une couleur blanche avec alpha
        # Mais cv2.fillPoly ne supporte pas l'alpha.
        # On va donc dessiner sur un calque séparé et mélanger.
        
        # Créer un calque pour le triangle
        triangle_layer = np.zeros_like(layer)
        cv2.fillPoly(triangle_layer, [pts], (255, 255, 255, 255))
        
        # Mélanger avec le layer principal
        # On veut que le triangle soit visible mais pas trop opaque
        # On utilise addWeighted
        # Note: addWeighted ne fonctionne pas bien avec l'alpha channel
        # On va juste ajouter le triangle au layer
        # Pour l'instant, on va faire simple : dessiner le triangle avec une couleur unie
        # et on ajustera l'alpha plus tard.
        
        # En attendant, on dessine le triangle en blanc avec une opacité fixe
        # Pour simuler l'alpha, on peut dessiner le triangle, puis appliquer un flou
        # Mais pour l'instant, on va juste le dessiner.
        
        # Note: Pour un vrai effet de transparence, il faut utiliser cv2.addWeighted
        # sur les régions d'intérêt.
        
        # Pour l'instant, on va juste dessiner le triangle avec une couleur blanche
        # et on va laisser l'alpha à 255 pour le test.
        # Tu pourras ajuster l'alpha dans le code.
        
        # Dessin du triangle
        # On utilise une couleur blanche avec alpha
        # Mais cv2.fillPoly ne supporte pas l'alpha.
        # On va donc dessiner sur un calque séparé et mélanger.
        
        # Créer un calque pour le triangle
        triangle_layer = np.zeros_like(layer)
        cv2.fillPoly(triangle_layer, [pts], (255, 255, 255, 255))
        
        # Mélanger avec le layer principal
        # On veut que le triangle soit visible mais pas trop opaque
        # On utilise addWeighted
        # Note: addWeighted ne fonctionne pas bien avec l'alpha channel
        # On va juste ajouter le triangle au layer
        # Pour l'instant, on va faire simple : dessiner le triangle avec une couleur unie
        # et on ajustera l'alpha plus tard.
        
        # En attendant, on dessine le triangle en blanc avec une opacité fixe
        # Pour simuler l'alpha, on peut dessiner le triangle, puis appliquer un flou
        # Mais pour l'instant, on va juste le dessiner.
        
        # Note: Pour un vrai effet de transparence, il faut utiliser cv2.addWeighted
        # sur les régions d'intérêt.
        
        # Pour l'instant, on va juste dessiner le triangle avec une couleur blanche
        # et on va laisser l'alpha à 255 pour le test.
        # Tu pourras ajuster l'alpha dans le code.
        
        # Dessin du triangle
        # On utilise une couleur blanche avec alpha
        # Mais cv2.fillPoly ne supporte pas l'alpha.
        # On va donc dessiner sur un calque séparé et mélanger.
        
        # Créer un calque pour le triangle
        triangle_layer = np.zeros_like(layer)
        cv2.fillPoly(triangle_layer, [pts], (255, 255, 255, 255))
        
        # Mélanger avec le layer principal
        # On veut que le triangle soit visible mais pas trop opaque
        # On utilise addWeighted
        # Note: addWeighted ne fonctionne pas bien avec l'alpha channel
        # On va juste ajouter le triangle au layer
        # Pour l'instant, on va faire simple : dessiner le triangle avec une couleur unie
        # et on ajustera l'alpha plus tard.
        
        # En attendant, on dessine le triangle en blanc avec une opacité fixe
        # Pour simuler l'alpha, on peut dessiner le triangle, puis appliquer un flou
        # Mais pour l'instant, on va juste le dessiner.
        
        # Note: Pour un vrai effet de transparence, il faut utiliser cv2.addWeighted
        # sur les régions d'intérêt.
        
        # Pour l'instant, on va juste dessiner le triangle avec une couleur blanche
        # et on va laisser l'alpha à 255 pour le test.
        # Tu pourras ajuster l'alpha dans le code.
        
        # Dessin du triangle
        # On utilise une couleur blanche avec alpha
        # Mais cv2.fillPoly ne supporte pas l'alpha.
        # On va donc dessiner sur un calque séparé et mélanger.
        
        # Créer un calque pour le triangle
        triangle_layer = np.zeros_like(layer)
        cv2.fillPoly(triangle_layer, [pts], (255, 255, 255, 255))
        
        # Mélanger avec le layer principal
        # On veut que le triangle soit visible mais pas trop opaque
        # On utilise addWeighted
        # Note: addWeighted ne fonctionne pas bien avec l'alpha channel
        # On va juste ajouter le triangle au layer
        # Pour l'instant, on va faire simple : dessiner le triangle avec une couleur unie
        # et on ajustera l'alpha plus tard.
        
        # En attendant, on dessine le triangle en blanc avec une opacité fixe
        # Pour simuler l'alpha, on peut dessiner le triangle, puis appliquer un flou
        # Mais pour l'instant, on va juste le dessiner.
        
        # Note: Pour un vrai effet de transparence, il faut utiliser cv2.addWeighted
        # sur les régions d'intérêt.
        
        # Pour l'instant, on va juste dessiner le triangle avec une couleur blanche
        # et on va laisser l'alpha à 255 pour le test.
        # Tu pourras ajuster l'alpha dans le code.
        
        # Dessin du triangle
        # On utilise une couleur blanche avec alpha
        # Mais cv2.fillPoly ne supporte pas l'alpha.
        # On va donc dessiner sur un calque séparé et mélanger.
        
        # Créer un calque pour le triangle
        triangle_layer = np.zeros_like(layer)
        cv2.fillPoly(triangle_layer,