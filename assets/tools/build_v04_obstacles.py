"""v0.4 obstacles: writes all new top (hanging) and bottom (standing) SVGs and exposes HIT / EDGES / stage maps."""
import build_v04_tops, build_v04_bottoms
from v04_common import FILES, HIT, EDGES, write_all

STAGE_TOPS = {  # suggested weights; Tuning owns the final numbers
  "graveyard":   {"obs-graveyard-lantern-branch": 2, "obs-graveyard-spider": 2},
  "church":      {"obs-church-chandelier": 2, "obs-church-bats": 1, "obs-church-bell": 1},
  "countryside": {"obs-countryside-beehive": 2, "obs-countryside-branch": 2, "obs-countryside-swing": 1},
  "schools":     {"obs-school-handbell": 2, "obs-school-kite": 2, "obs-school-lamp": 1},
  "city":        {"obs-city-cradle": 2, "obs-city-trafficlight": 2, "obs-city-neonsign": 1, "obs-city-cranehook": 1},
  "space":       {"obs-space-satellite": 2, "obs-space-arm": 1, "obs-space-astronaut": 1, "obs-space-ufo": 1},
}
STAGE_BOTTOMS = {
  "graveyard":   {"tomb-a": 1, "tomb-b": 1, "tomb-c": 1, "coffin": 1, "cross": 1},
  "church":      {"obs-church-ivystone": 2, "obs-church-font": 1, "obs-church-lychgate": 1},
  "countryside": {"obs-countryside-haybales": 2, "obs-countryside-pumpkinstack": 1, "obs-countryside-churn": 1},
  "schools":     {"obs-school-books": 2, "obs-school-lockers": 2, "obs-school-globe": 1},
  "city":        {"obs-city-postbox": 2, "obs-city-phonebox": 1, "obs-city-hydrant": 1},
  "space":       {"moonrock": 2, "obs-space-crystals": 1, "obs-space-alienplant": 1},
}
RETIRED_TOPS = {
  "tomb-a": "graveyard top", "tomb-b": "graveyard top", "tomb-c": "graveyard top",
  "obs-church-spire": "church top", "obs-countryside-scarecrow": "countryside top",
  "obs-school-clocktower": "schools top", "obs-school-chimney": "schools top", "obs-city-skyscraper": "city top",
}
if __name__ == "__main__":
    write_all(); print(len(FILES), "v0.4 files")
