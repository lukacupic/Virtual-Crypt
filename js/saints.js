import * as THREE from "three";

export class SaintManager {
  constructor(context) {
    this.context = context;
    this.saints = new Map();
    this.saintNearby;
    this.saintsInfo;
    this.infoElement = context.getElementById("info");
    this.infoElementMain = context.getElementById("info-main");
  }

  saveToSaints(mesh) {
    let name = mesh.name;

    if (name.includes("Paulus")) {
      mesh.infoText =
        "HR | Sveti Pavao nadbiskup Carigradski (+350.) rođen je u Solunu. Tajnik je nadbiskupa u Carigradu. Teolog je na Nicejskom koncilu 325. Proganjan i ubijen 350. Tijelo mu je 391. godine preneseno u katedralu Svete Sofije koja je preimenovana u katedralu svetog Pavla mučenika.<br><br>EN | Saint Paul the Archbishop of Constantinople (+350) was born in Thessaloniki. He is the secretary of the archbishop in Constantinople.  He was a theologian at the Council of Nicaea in 325. He was persecuted and killed in 350. In 391, his body was transferred to the Cathedral of St. Sophia, which was renamed the Cathedral of St. Paul the Martyr.";
    } else if (name.includes("Sebastianus")) {
      mesh.infoText =
        "HR | Sveti Sebastijan (+282.) rođen u Španjolskoj, bio je šef tjelesne straže rimskih careva. Car ga je osudio na muke strelicama i rasječen je jer nije htio napustiti vjeru u jednoga Boga. Pokopan je u Rimu. U 8. stoljeću, u vrijeme kuge u Rimu, njegove su relikvije nosili gradom i kuga je prestala. Zaštitnik je protiv zaraznih bolesti.<br><br>EN | Saint Sebastian (+282), born in Spain, was head of the Roman emperors' bodyguards. The Emperor sentenced him to torture by arrows and had him cut down because he did not wish to relinquish his belief in one God. He was buried in Rome. In the 8th century, in a Plague-struck Rome, his relics were spread around the city and the plague vanished. He is a protector against transmitted diseases.";
    } else if (name.includes("Barbara")) {
      mesh.infoText =
        "HR | Sveta Barbara (+288.) rođena je u Nikomediji blizu Carigrada. Otac je poganin, oficir, hvata kršćane i predaje ih sudu. Žena je kršćanka i potajno krsti kćerku. Majka je umrla kad su Barbari bile četiri godine. Odgajaju je ropkinje. Kao kršćanka odbija da na zahtjev oca nađe bogatog muža. Otac ju maltretira i predaje sudu. Nakon cjelodnevnog mučenja, otac joj je mačem odrubio glavu. Njega je iz vedra ubio grom. Zaštitnica je mladih, rudara, vatrogasaca, minera i od gromova.<br><br>EN | Saint Barbara (+288) was born in Nicomedia near Constantinople.  The father is a pagan, an officer; he captures Christians and delivers them to the court.  The woman is a Christian and secretly baptizes her daughter. Mother died when Barbara was four years old and was raised by female slaves. As a Christian, she refuses to find a rich husband at her father's request. Her father mistreats her and takes her to court. After a whole day of torture, the father cuts her head off with a sword. He was killed by lightning out of the blue. She is the protector of young people, firefighters, miners, and against lightning.";
    } else if (name.includes("Nicolosa")) {
      mesh.infoText =
        "HR | Sveta Nikoloza Bursa (+1512.) rođena je u Modonu u Grčkoj. Nakon kratkog boravka u Kopru, 1465. ulazi u benediktinski samostanu u Veneciji. Opatica je doživotno. Za vrijeme molitve tijelo joj levitira. U viđenju vidi dan svoje smrti 23. travnja 1512. Prema smrti biva sve sretnija. Tijelo joj je 14 godina nakon smrti nađeno neraspadnuto. I do danas su joj, neobjašnjivo, očuvani svi unutarnji organi.<br><br>EN | Saint Nicholoza Bursa (+1512) was born in Modon, Greece.  After a short stay in Koper, in 1465 she entered the Benedictine monastery in Venice. She is an abbess for life. During prayer, her body levitates. In a vision, she sees the day of her death, April 23, 1512. Towards death, she becomes happier. Her body was found incorrupted 14 years after her death.  To this day, inexplicably, all of her internal organs have been preserved.";
    } else if (name.includes("Johanes")) {
      mesh.infoText =
        "HR | Sveti Ivan Olini (+1300.) Rođen je u Veneciji. S 42 godine postaje svećenik. U vrijeme kuge poslužuje bolesnike. Nije se zarazio i zovu ga „živući svetac“. Umro je s 85 godina. Pokopan je u crkvi San Zan Degola u Veneciji. Za ekshumacije zbog štovanja nalaze ga neraspadnuta tijela a na CT snimanju 2009. u tijelu su nađeni sačuvani svi organi što je odjeknulo kao senzacija.<br><br>EN | Saint Johannes Olini (+1300) was born in Venice.  At the age of 42, he became a priest.  During the plague, he serves the sick. He did not get infected and was called a 'living saint'. He died at the age of 85. He was buried in the church of San Zan Degola in Venice.  His incorrupted body was found after an exhumation due to worship. On a CT scan in 2009, all internal organs were found perfectly preserved in the body, which resonated as a sensation.";
    } else if (name.includes("Leonis")) {
      mesh.infoText =
        "HR | Sveti Leon Bembo (+1188.) rođen je u Veneciji. Bio je svećenik na Duždevu dvoru. Za vrijeme Druge križarske vojne 1140. postavljen je za nadbiskupa u Modonu na Peleponezu. Heretici su ga iznakazili. Vraća se Veneciju. Nitko ga ne prepoznaje. Živi kao pustinjak na otočiću San Servolo gdje je 1188. nađen mrtav. Nakon 20 godina na grobu se ukazuje svjetlost. Prenose ga u crkvu svetog Lovre gdje se zbivaju čudesa i sve do danas.<br><br>EN | Saint Leonis Bembo (+1188) was born in Venice.  He was a priest at Doge's court.  During the Second Crusade in 1140, he was appointed archbishop in Modon in the Peloponnese. The heretics disfigured him. When he returned to Venice, nobody recognized him. He lived as a hermit on the island of San Servolo, where he was found dead in 1188.  After 20 years, light appeared on his grave.  His body was taken to the church of St. Lawrence, where miracles still happen to this day.";
    }

    this.saints.set(name, mesh);

    let position = new THREE.Vector3();
    mesh.getWorldPosition(position);
    mesh.worldPosition = position;
  }

  checkDistanceToSaints(player) {
    let saints = this.saints;
    if (saints == null) return;

    for (const saint of saints.values()) {
      let distance = player.distanceTo(saint.worldPosition);
      if (distance < 5) {
        this.infoElement.style.visibility = "visible";
        this.infoElementMain.style.visibility = "visible";
        this.saintNearby = saint;

        return;
      }
    }

    this.infoElement.style.visibility = "hidden";
    this.infoElementMain.style.visibility = "hidden";
    this.infoElementMain.innerHTML = "";
    this.saintNearby = null;
  }

  displayText() {
    this.infoElementMain.innerHTML = this.saintNearby.infoText;
  }

  isSaint(object) {
    let name = object.name;
    return name.startsWith("Sactus") || name.startsWith("Sacta");
  }

  getSaintNearby() {
    return this.saintNearby;
  }

  getSaints() {
    return this.saints;
  }
}
