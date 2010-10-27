var austria_fixture = {
  "title": "Austria",
  "author": "John Doe",
  "children": [
    "preface", "history", "politics"
  ],
  "nodes": {
    "preface": {
      "type": "section",
      "name": "Preface",
      "children": ["p1"]
    },
    "history": {
      "type": "section",
      "name": "History",
      "children": ["p2"]
    },
    "politics": {
      "type": "section",
      "name": "Politics",
      "children": ["p3", "p4"]
    },
    "p1": {
      "type": "paragraph",
      "children": ["text1", "text2"]
    },
    "text1": {
      "type": "text",
      "em_level": 1,
      "content": "Austria, officially the Republic of Austria (German: Republik Österreich), is a landlocked country of roughly 8.3 million people[3] in Central Europe."      
    },
    "text2": {
      "type": "text",
      "content": "It is bordered by Germany and the Czech Republic to the north, Slovakia and Hungary to the east, Slovenia and Italy to the south, and Switzerland and Liechtenstein to the west",
      "em_level": 0
    },
    "p2": {
      "type": "paragraph",
      "children": ["text3"]
    },
    "p3": {
      "type": "paragraph",
      "children": ["text4"]
    },
    "p4": {
      "type": "paragraph",
      "children": ["text5"]
    },
    "text3": {
      "type": "text",
      "em_level": 0,
      "content": "Settled in ancient times,[11] the Central European land that is now Austria was occupied in pre-Roman times by various Celtic tribes. The Celtic kingdom of Noricum was later claimed by the Roman Empire and made a province."
    },
    "text4": {
      "type": "text",
      "em_level": 0,
      "content": "The Parliament of Austria is located in Vienna, the country's largest city and capital. Austria became a federal, parliamentary, democratic republic through the Federal Constitution of 1920. The political system of the Second Republic with its nine states is based on the constitution of 1920 and 1929, which was reenacted on May 1, 1945."
    },
    "text5": {
      "type": "text",
      "em_level": 0,
      "content": "The head of state is the Federal President (Bundespräsident), who is directly elected by popular vote. The chairman of the Federal Government is the Federal Chancellor, who is appointed by the president. The government can be removed from office by either a presidential decree or by vote of no confidence in the lower chamber of parliament, the Nationalrat."
    },
    "bmi": {
      "type": "reference",
      "title": "Bundesministerium für Inneres",
      "year": 2010,
      "url": "http://www.bmi.gv.at"
    },
    "statistic_austria": {
      "type": "reference",
      "title": "Bundesministerium für Inneres",
      "year": 2010,
      "url": "http://www.statistik.at/"
    }
  }
};