/* ============================================================
   A handful of well-known historical milestones per entity, for the
   synchronized dual-timeline view in the History category. Not
   exhaustive — 3-5 widely-cited events each, not a full history.
   ============================================================ */
const HistoryTimelines = {
  japan: [
    { year: "660 BCE", text: "Traditional (legendary) founding date, per the Nihon Shoki chronicle." },
    { year: "1603", text: "Tokugawa shogunate begins, ushering in over 250 years of relative isolation." },
    { year: "1868", text: "Meiji Restoration — rapid modernization and industrialization begins." },
    { year: "1947", text: "Postwar Constitution takes effect, establishing the current parliamentary system." },
  ],
  "south-korea": [
    { year: "1392", text: "Joseon dynasty founded, ruling for over 500 years." },
    { year: "1910–1945", text: "Japanese colonial rule." },
    { year: "1948", text: "Republic of Korea established after Japan's surrender." },
    { year: "1987", text: "Direct presidential elections restored, marking full democratization." },
  ],
  china: [
    { year: "221 BCE", text: "Qin dynasty unifies China under its first emperor." },
    { year: "1912", text: "Qing dynasty falls; Republic of China founded." },
    { year: "1949", text: "People's Republic of China founded under Mao Zedong." },
    { year: "1978", text: "'Reform and Opening Up' economic reforms begin under Deng Xiaoping." },
  ],
  india: [
    { year: "c. 3300 BCE", text: "Indus Valley Civilization emerges — one of the world's oldest urban cultures." },
    { year: "1858", text: "British Crown rule (the Raj) begins after the 1857 rebellion." },
    { year: "1947", text: "Independence and partition into India and Pakistan." },
    { year: "1950", text: "Constitution of India takes effect, founding the republic." },
  ],
  "united-states": [
    { year: "1776", text: "Declaration of Independence from Great Britain." },
    { year: "1789", text: "U.S. Constitution takes effect; George Washington becomes first president." },
    { year: "1861–1865", text: "Civil War, ending slavery via the 13th Amendment." },
    { year: "1945", text: "Emerges from WWII as a global superpower." },
  ],
  germany: [
    { year: "1871", text: "German Empire unified under Prussian leadership." },
    { year: "1933–1945", text: "Nazi era and World War II." },
    { year: "1949", text: "Divided into West Germany (FRG) and East Germany (GDR)." },
    { year: "1990", text: "Reunification of East and West Germany." },
  ],
  brazil: [
    { year: "1500", text: "Portuguese colonization begins." },
    { year: "1822", text: "Independence declared from Portugal." },
    { year: "1889", text: "Empire abolished; republic proclaimed." },
    { year: "1988", text: "Current democratic Constitution adopted after military rule ends." },
  ],
  russia: [
    { year: "862", text: "Traditional founding of Kievan Rus'." },
    { year: "1547", text: "Ivan IV crowned the first Tsar of Russia." },
    { year: "1917", text: "Russian Revolution ends imperial rule; Soviet era begins." },
    { year: "1991", text: "Soviet Union dissolves; the Russian Federation is established." },
  ],
  australia: [
    { year: "c. 65,000 years ago", text: "Aboriginal Australians' presence, among the longest continuous cultures on Earth." },
    { year: "1788", text: "British penal colony established at Sydney Cove." },
    { year: "1901", text: "Federation — the six colonies unite as the Commonwealth of Australia." },
  ],
  canada: [
    { year: "1608", text: "Quebec City founded, a foothold of New France." },
    { year: "1867", text: "Confederation — Canada becomes a self-governing dominion." },
    { year: "1982", text: "Constitution patriated from the UK with the Canadian Charter of Rights." },
  ],
  iceland: [
    { year: "874", text: "Traditional date of Norse settlement." },
    { year: "930", text: "Althing founded — one of the world's oldest surviving parliaments." },
    { year: "1944", text: "Full independence from Denmark, republic proclaimed." },
  ],
  singapore: [
    { year: "1819", text: "British trading post founded by Stamford Raffles." },
    { year: "1942–1945", text: "Japanese occupation during World War II." },
    { year: "1965", text: "Independence after separation from the Federation of Malaysia." },
  ],
  "united-kingdom": [
    { year: "1215", text: "Magna Carta signed, an early check on royal power." },
    { year: "1707", text: "Acts of Union create Great Britain." },
    { year: "1801", text: "Acts of Union with Ireland form the United Kingdom." },
    { year: "1973/2020", text: "Joins, then later leaves (Brexit), the European Union." },
  ],
  france: [
    { year: "843", text: "Treaty of Verdun — West Francia, the kernel of modern France, established." },
    { year: "1789", text: "French Revolution begins, ending the absolute monarchy." },
    { year: "1958", text: "Fifth Republic founded under Charles de Gaulle." },
  ],
  nigeria: [
    { year: "1885–1900", text: "British colonial rule established over the region." },
    { year: "1914", text: "Northern and Southern protectorates amalgamated into one colony." },
    { year: "1960", text: "Independence from the United Kingdom." },
    { year: "1999", text: "Fourth Republic begins, ending prolonged military rule." },
  ],
  egypt: [
    { year: "c. 3100 BCE", text: "Upper and Lower Egypt unified under the first pharaohs." },
    { year: "30 BCE", text: "Becomes a Roman province after Cleopatra's death." },
    { year: "1922", text: "Nominal independence from Britain (full sovereignty 1952)." },
    { year: "1952", text: "Free Officers Revolution ends the monarchy." },
  ],
  indonesia: [
    { year: "1602", text: "Dutch East India Company begins colonial control." },
    { year: "1942–1945", text: "Japanese occupation during World War II." },
    { year: "1945", text: "Independence declared by Sukarno (recognized by the Netherlands in 1949)." },
    { year: "1998", text: "Reformasi — Suharto's 32-year rule ends." },
  ],
  switzerland: [
    { year: "1291", text: "Federal Charter — traditional founding of the Swiss Confederacy." },
    { year: "1815", text: "Permanent neutrality recognized at the Congress of Vienna." },
    { year: "1848", text: "Federal Constitution establishes the modern federal state." },
  ],
  "new-zealand": [
    { year: "1840", text: "Treaty of Waitangi signed between the British Crown and Māori chiefs." },
    { year: "1893", text: "First country in the world to grant women the right to vote." },
    { year: "1947", text: "Full legislative independence from the UK adopted." },
  ],
  taiwan: [
    { year: "1624–1662", text: "Dutch colonial period." },
    { year: "1895–1945", text: "Japanese colonial rule." },
    { year: "1949", text: "Republic of China government relocates to Taiwan after the Chinese Civil War." },
    { year: "1996", text: "First direct presidential election, completing democratization." },
  ],
  "hong-kong": [
    { year: "1842", text: "Ceded to Britain after the First Opium War." },
    { year: "1898", text: "New Territories leased to Britain for 99 years." },
    { year: "1997", text: "Handover to China under 'One Country, Two Systems'." },
  ],
  greenland: [
    { year: "c. 985", text: "Norse settlement led by Erik the Red." },
    { year: "1721", text: "Danish colonization begins." },
    { year: "1979", text: "Home rule granted." },
    { year: "2009", text: "Self-Government Act expands autonomy within Denmark." },
  ],
  "puerto-rico": [
    { year: "1493", text: "Reached by Columbus on his second voyage; Spanish colonization follows." },
    { year: "1898", text: "Ceded to the United States after the Spanish-American War." },
    { year: "1952", text: "Commonwealth (Estado Libre Asociado) status established." },
  ],
  california: [
    { year: "1769", text: "First Spanish mission established at San Diego." },
    { year: "1848", text: "Ceded to the U.S. after the Mexican-American War; Gold Rush begins soon after." },
    { year: "1850", text: "Admitted as the 31st U.S. state." },
  ],
  hawaii: [
    { year: "1795", text: "Kamehameha I unifies the Hawaiian Islands." },
    { year: "1893", text: "Overthrow of the Kingdom of Hawaii." },
    { year: "1898", text: "Annexed by the United States." },
    { year: "1959", text: "Admitted as the 50th U.S. state." },
  ],
};
