Better Rolls supports some additional active effects:

# Gang Up Active Effects
- `brsw-ac.gangup-reduction`: This key is used to mark that an actor has gangup reduction. The total value of this effect will be *deducted* from the gangup bonus of attacks against this actor.
- `brsw-ac.gangup-addition`: This key is used to mark that an actor has gangup addition. The total value of this effect will be *added* to the gangup bonus of attacks against this actor.

# Illumination Active Effects
- `brsw.illumination-modifier`: This key is used to increase or decrease the illumination penalty. Positive values decrease the penalty, while negative values increase the penalty. An actor can never get a bonus from illumination using this key.