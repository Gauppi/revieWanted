# revieWanted
Suche nach reviewbedürftigen Themengebieten

**revieWanted** ist eine Webseite die es Forschern und gesundheitsfachpersonen ermöglicht Publikationsdaten für eine SNA aufzubereiten. Hierbei werden Publikationsdaten aus PubMed und Zitationsmerkmale aus iCite extrahiert und zusammengeführt. 

## Nutzen und Ziel
In diesem Projekt wird ein Umwandlungstool in Form einer Webseite erstellt, welche das Analysieren von Publikationsdaten (Zitationen) vorbereitet. Der Input wird in ein XML ähnliches Format geparsed (graphml). Somit wird das Ergebnis heruntergealden und in einem Visualisierungstool wie Gephi importiert. Des Weiteren besteht eine Möglichkeit für den Benutzer den Output zu parametrisieren, um den zu erstellenden Graphen weitere oder weniger Merkmale mitzugeben. 

## Projekt Status
Prototyp / Konzept Phase

## Artikeldaten
| PubMed article PMID |
| ------------------- |
| uid                 |
| attributes          |
| authors             |
| fulljournalname     |
| lang                |
| title               |
| pubdate             |


| iCite article PMID |
| ----------------------- |
| pmid                    |
| year                    |
| title                   |
| journal                 |
| is_research_article     |
| relative_citation_ratio |
| human                   |
| animal                  |
| molecular_cellular      |
| is_clinical             |
| citation_count          |
| citation_count_per_year |
| expected_"cc"_per_year  |
| field_citation_rate     |
| provisional             |
| cited_by_clin           |
| cited_by                |
| references              |
| doi                     |

## Probleme
- Output in ein XML / graphML Format zu parametrisieren
- SVG Visualierung mit D3

## Roadmap
-before working locally for each variation (R, js, python)
- 18.10.22 create Github repository SNA_feeder
- 28.10.22 create Git Lab repository
- 07.11.22 delivery first prototype 

