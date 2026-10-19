-- =====================================================================
-- SCP Foundation Catalogue: seed data
-- COMP.6210 Assignment 2
--
-- Loads the 20 catalogue subjects (SCP-002 to SCP-021) into the tables
-- created by schema.sql.
-- Run this whole file in the Supabase dashboard: SQL Editor > New query.
--
-- Before running:
--   1. schema.sql has been run.
--   2. The subject images are uploaded to the scp-images storage bucket in a
--      folder called "seed" (scp-images/seed/scp-002.jpg, ...). image_url
--      below holds each image's public URL. A subject whose image has not
--      been uploaded yet shows the app's placeholder image instead; upload
--      the file later under the same name and it appears without re-running
--      this script.
--
-- Content credit
--   Subject text is adapted from the SCP Wiki (https://scp-wiki.wikidot.com),
--   licensed under CC BY-SA 3.0. SCP-014 is an original subject.
--
-- How it works
--   - Seeded subjects have owner_id = NULL: they belong to no editor, so
--     only admins can edit them (see the RLS policies in schema.sql).
--   - The SQL Editor runs as an admin role that bypasses Row Level
--     Security, which is why these inserts are allowed.
--   - Each section is linked to its subject by looking the subject up by
--     its item number, so no ids are hardcoded.
--   - position numbers keep paragraphs in their original order.
--   - Safe to run again: it first deletes these subjects, and ON DELETE
--     CASCADE removes all their sections, so nothing is duplicated.
--   - Everything runs in one transaction: if any statement fails, none of
--     the changes are kept.
-- =====================================================================

begin;

-- Remove any previous copy of these subjects (cascades to their sections).
delete from public.scp_subjects
where item in (
  'SCP-002', 'SCP-003', 'SCP-004', 'SCP-005', 'SCP-006',
  'SCP-007', 'SCP-008', 'SCP-009', 'SCP-010', 'SCP-011',
  'SCP-012', 'SCP-013', 'SCP-014', 'SCP-015', 'SCP-016',
  'SCP-017', 'SCP-018', 'SCP-019', 'SCP-020', 'SCP-021'
);

-- ---------------------------------------------------------------------
-- SCP-002 (Euclid)
-- ---------------------------------------------------------------------
insert into public.scp_subjects (item, object_class_id, summary, image_url, image_alt, owner_id)
values (
  'SCP-002',
  (select id from public.object_classes where name = 'Euclid'),
  'A fleshy, tumor-like structure containing an apartment-like interior formed from transformed human biological material.',
  'https://cpubzanyrlsbmqasawdm.supabase.co/storage/v1/object/public/scp-images/seed/scp-002.jpg',
  'SCP-002 specimen in containment',
  null
);

-- Special Containment Procedures
insert into public.containment_procedures (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-002'), v.position, v.body
from (values
  (1, 'SCP-002 is to remain connected to a suitable power supply at all times, to keep it in what appears to be a recharging mode. In case of electrical outage, the emergency barrier between the object and the facility is to be closed and the immediate area evacuated. Once facility power is re-established, alternating bursts of X-ray and ultraviolet light must strobe the area until SCP-002 is re-affixed to the power supply and returned to recharging mode. Containment area is to be kept at negative air pressure at all times.'),
  (2, 'Teams including a minimum of two (2) members are required within 20 meters of SCP-002 or its containment area. Personnel should maintain physical contact with one another at all times to confirm there is another person present, as perception may be dulled, skewed, or influenced by proximity to the object.'),
  (3, 'No personnel below Level 3 are permitted within SCP-002. This requirement may be waived via written authorization from two (2) off-site Level 4 administrators. Command staff issued such a waiver must be escorted by at least five (5) Level 3 Security personnel for the duration of their contact and must temporarily surrender their rank and security clearance. Following contact, command staff will be escorted at least 5 km from SCP-002 to undergo a seventy-two (72)-hour quarantine and psychological evaluation. If deemed fit for return to duty by psych staff, rank and security clearance may be restored when quarantine expires.')
) as v(position, body);

-- Description
insert into public.descriptions (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-002'), v.position, v.body
from (values
  (1, 'SCP-002 resembles a tumorous, fleshy growth with a volume of roughly 60 m³ (or 2000 ft³). An iron valve hatch on one side leads to its interior, which appears to be a standard low-rent apartment of modest size. One wall of the room possesses a single window, though no such opening is visible from the exterior. The room contains furniture which, upon close examination, appears to be sculpted bone, woven hair, and various other biological substances produced by the human body. All matter tested thus far show independent or fragmented DNA sequences for each object in the room.'),
  (2, 'Refer to the Mulhausen Report [cross-ref:document00.023.603] for details related to object''s discovery.')
) as v(position, body);

-- Reference
insert into public.subject_references (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-002'), v.position, v.body
from (values
  (1, 'To date, subject has been responsible for the disappearances of seven personnel. It has also in its time at the facility further furnished itself with two lamps, a throw rug, a television, a radio, a beanbag chair, three books in an unknown language, four children''s toys, and a small potted plant. Tests with a variety of lab animals including higher primates have failed to provoke a response in SCP-002. Cadavers as well fail to produce any effect. Whatever process the subject uses to convert organic matter into furnishings is apparently only facilitated by the introduction of living humans.')
) as v(position, body);

-- Field report (the report row first, then its entries linked to it)
insert into public.field_reports (subject_id, title, intro)
values ((select id from public.scp_subjects where item = 'SCP-002'), 'Mulhausen Report — docid:00.023.603', 'The following is a brief report detailing the discovery of SCP-002');

insert into public.field_report_entries (field_report_id, position, body)
select fr.id, v.position, v.body
from public.field_reports fr
cross join (values
  (1, 'Subject was discovered in a small crater in northern Portugal where it struck the Earth from orbit. Encased in a shell of thick rock, the fleshy exterior of the object was exposed by the impact. A native farmer happened upon the site and reported his findings to the village elder. Subject gained SCP attention when a Level 4 agent posted in the area detected a small radioactive anomaly generated by the object.'),
  (2, 'A collection squad of SCP security personnel led by General Mulhausen was immediately dispatched to the area where they quickly secured the subject in a large container and performed initial testing with subjects recruited from the nearby village. Three men individually sent into the structure subsequently disappeared. Upon discovering this deadly property of the subject, General Mulhausen issued a Level 4a Termination Order of any witnesses (roughly 1/3 of the village) to ensure no outside knowledge of the object and initiated its transport to SCP facility [DATA REDACTED].'),
  (3, 'During preparation for transport, four SCP security personnel were inexplicably drawn inside the object where they too immediately disappeared. Following inspection, it appeared as if the object had "grown" several new furnishings and was beginning to look like the interior of an apartment room. General Mulhausen immediately ordered the requisition of several Class III HAZMAT suits for the remaining security team members, who proceeded to lift the container onto a waiting freight ship for transport to the SCP containment facility.'),
  (4, '[DATA REDACTED]'),
  (5, '[DATA REDACTED]'),
  (6, 'Following the termination of General Mulhausen, SCP-002 was re-secured by SCP staff and brought into special containment in [CLASSIFIED], where it currently resides. Staff with clearance below Level 3 have been denied access to the SCP-002 container without prior approval of at least two Level 4 staff after the Mulhausen incident.')
) as v(position, body)
where fr.subject_id = (select id from public.scp_subjects where item = 'SCP-002');

-- ---------------------------------------------------------------------
-- SCP-003 (Euclid)
-- ---------------------------------------------------------------------
insert into public.scp_subjects (item, object_class_id, summary, image_url, image_alt, owner_id)
values (
  'SCP-003',
  (select id from public.object_classes where name = 'Euclid'),
  'A sentient biological circuit-like mass restrained on an ancient rune-inscribed tablet, dormant only above critical temperature.',
  'https://cpubzanyrlsbmqasawdm.supabase.co/storage/v1/object/public/scp-images/seed/scp-003.jpg',
  'SCP-003 biological circuitry structure',
  null
);

-- Special Containment Procedures
insert into public.containment_procedures (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-003'), v.position, v.body
from (values
  (1, 'SCP-003 is to be maintained at a constant temperature of no less than 35°C and ideally kept above 100°C. No living multicellular organisms of Category IV or higher complexity may be allowed to come into contact with SCP-003.'),
  (2, 'In event of total power failure, if SCP-003-1 begins to increase its mass, assigned personnel must engage in skin contact with SCP-003-1. Ideally, personnel may use their body heat to return SCP-003-1 to above the critical temperature; however, skin contact must be maintained even in event of SCP-003 reaching activation temperature, lasting at minimum until SCP-003-1 advances fully to its second growth stage.'),
  (3, 'Personnel who enter SCP-003''s containment area must first be examined for body parasites of Category IV or higher complexity, and sterilized if such organisms are present. All personnel who have come in physical contact with SCP-003-1 are to immediately report for sterilization afterwards.'),
  (4, 'SCP-003-1 must not be removed from SCP-003-2 except in case of emergency procedures detailed above. Any significant change in SCP-003-2''s rune activity (including pattern, frequency, or color) should be reported within three (3) hours of occurrence. Cessation of rune activity must be reported immediately. SCP-003-2 must be supplied with power via the source designated Generator 003-IX at all times.')
) as v(position, body);

-- Description
insert into public.descriptions (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-003'), v.position, v.body
from (values
  (1, 'SCP-003 consists of two related components of separate origin, referred to as SCP-003-1 and SCP-003-2.'),
  (2, 'SCP-003-1 appears to be composed of chitin, hair, and nails of unknown biology, arranged in a configuration similar to that of a computer motherboard. Testing reveals SCP-003-1 to predate earliest known circuit boards by a factor of thousands of years. SCP-003-1 is considered sentient but not actively dangerous except under certain conditions.'),
  (3, 'SCP-003-1 was found on a stone tablet, SCP-003-2, on which it currently resides. The runes on SCP-003-2 are not part of any known language, and emit pale, flickering light patterns.'),
  (4, 'SCP-003-2 is controlled by a (non-biological) internal computer, the contents of which are mostly inaccessible without risk of damaging SCP-003-2. SCP-003-2 is capable of controlled emissions of radiation, including heat, light, and anomalous radiation types. SCP-003-2 contains an internal power source of an anomalous nature, which appears to have been losing power since several centuries before discovery.'),
  (5, 'It is considered probable that SCP-003-2 was created for the purpose of containing SCP-003-1. Partially interpreted data recovered from SCP-003-2 may refer to a past and/or potential future LK-class restructuring event caused by SCP-003-1.'),
  (6, 'SCP-003 was located by remote viewing team SRV-04 Beta. It appears possible that SRV-04 Beta was deliberately contacted by SCP-003-2. Other organizations have also been alerted to SCP-003''s existence, possibly by similar means. Despite this activity, SCP-003-2 does not appear to be sentient, based on its lack of reaction to M03-Gloria analysis and procedures.'),
  (7, 'When SCP-003 drops below the temperature of 35°C, both components react. First, SCP-003-1 enters a growth state characterized by an exponential increase in mass, partially fueled by converting surrounding inorganic and nonliving organic matter. During each growth stage, SCP-003-2 releases bursts of radiation that temporarily inhibit or reverse SCP-003-1''s growth.')
) as v(position, body);

-- Addenda (author_id NULL: original file content, not written by a user).
-- created_at is staggered by position so they display in their original order.
insert into public.addenda (subject_id, author_id, title, body, created_at)
select (select id from public.scp_subjects where item = 'SCP-003'), null, v.title, v.body, now() + v.position * interval '1 second'
from (values
  (1, 'Addendum 003-01', 'Acting on information gathered from linguistic analysis of SCP-003-2''s runes and comparative data analysis, Research Team M03-Gloria has managed to establish a link between SCP-003 and [DATA REDACTED] for analysis of functions. SCP-003-1 must now be considered sentient, and is to be kept a minimum of 1 km from [DATA REDACTED] and the resulting "by-product" at all times.'),
  (2, 'Addendum 003-02', 'SCP-003-2''s power loss has been exacerbated by the procedures performed by M03-Gloria. On orders of O5-10, M03-Gloria will continue procedures.'),
  (3, 'Addendum 003-03', 'During M03-Gloria procedures, SCP-003-1 doubled its mass and began rapid structural growth. Temperature was immediately returned to 100°C. Growth continued for 9 minutes and 6 seconds, at which time a sustained radiation spike was produced by SCP-003-2. SCP-003-1 returned to its normal state in 3 minutes and 39 seconds. Both SCP-003-1 and SCP-003-2 ceased all detectable activity until reconnected to external power.'),
  (4, 'Addendum 003-04', 'The procedure detailed in Addendum 003-03 was repeated. SCP-003-1 breached containment, entering the observation gallery where nine members of M03-Gloria were present, and rearranged itself into a three-metre-tall humanoid form before attempting rudimentary vocal communication. [DATA REDACTED] Agent Jackson of M03-Gloria successfully restored power and SCP-003-1 was re-contained without further incident.'),
  (5, 'Addendum 003-05', 'In light of the previous incident, O5-10 was removed from the O5 Council by joint decision of O5-[DATA REDACTED], O5-[DATA REDACTED], and O5-[DATA REDACTED]. M03-Gloria procedures have been indefinitely suspended.')
) as v(position, title, body);

-- ---------------------------------------------------------------------
-- SCP-004 (Euclid)
-- ---------------------------------------------------------------------
insert into public.scp_subjects (item, object_class_id, summary, image_url, image_alt, owner_id)
values (
  'SCP-004',
  (select id from public.object_classes where name = 'Euclid'),
  'An anomalous barn door and twelve keys granting access to unstable extradimensional space, most fatal to those who enter.',
  'https://cpubzanyrlsbmqasawdm.supabase.co/storage/v1/object/public/scp-images/seed/scp-004.jpg',
  'SCP-004 anomalous door and key access point',
  null
);

-- Special Containment Procedures
insert into public.containment_procedures (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-004'), v.position, v.body
from (values
  (1, 'When handling items SCP-004-2 through SCP-004-13, proper procedure is vital. The items are not permitted to be moved off-site unless accompanied by two Level 4 security personnel. Under no circumstances should any other component of SCP-004 be taken through SCP-004-1. Should any of the objects contained within SCP-004-1 breach containment, or the facility be breached, the keys must be brought inside and the door closed prior to activation of Site 62''s on-site warhead. Unauthorized removal of keys from the testing area is grounds for immediate termination.'),
  (2, 'Level 1 clearance is required for basic access to SCP-004-1; Level 4 clearance is required for use of SCP-004-2 to -13.')
) as v(position, body);

-- Description
insert into public.descriptions (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-004'), v.position, v.body
from (values
  (1, 'SCP-004 consists of an old wooden barn door (SCP-004-1) and a set of twelve rusted steel keys (SCP-004-2 through SCP-004-13). The door itself is the entrance to an abandoned factory in [DATA REDACTED].'),
  (2, 'Testing on SCP-004 reveals that ten of the keys open SCP-004-1 on a dimension where the laws of physics and topology are significantly different than those of our home dimension. Test subjects meeting these hostile conditions are torn apart, their body parts deposited in various locations, only three of which have been verified to be on Earth.'),
  (3, 'SCP-004 seems to propagate spatiotemporal anomalies. Personnel leaving the facility report losing time, and records of work completed and supplies consumed support their claims.')
) as v(position, body);

-- Reference
insert into public.subject_references (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-004'), v.position, v.body
from (values
  (1, 'All Class D personnel using SCP-004-12 return in a catatonic state, unable to speak. Of sixteen subjects, only four have survived, and only one regained speech following long-term psychotherapy, describing a massive green creature so large that much of its body extended beyond his field of view.')
) as v(position, body);

-- Chronology (source dates are US-style MM/DD/YYYY, e.g. 09/25/2000;
-- to_date converts them to the date type)
insert into public.chronology_entries (subject_id, position, event_date, body)
select (select id from public.scp_subjects where item = 'SCP-004'), v.position, to_date(v.event_date, 'MM/DD/YYYY'), v.body
from (values
  (1, '07/02/1949', 'A group of three juveniles trespassing on federal property find the door and a set of rusted keys in an iron lockbox. One of their friends (SCP-004-CAS01) goes missing after the door is opened.'),
  (2, '07/03/1949', 'The severed remains of SCP-004-CAS01 are found scattered up to 32 km from the factory. The SCP Foundation takes over the investigation.'),
  (3, '07/04/1949', 'Twelve Class D personnel each test a different key. Of the twelve, only two survive — one (SCP-004-7) returns unharmed, the other in a near-catatonic state.'),
  (4, '09/25/2000', 'Site-62 becomes operational, built around SCP-004-1 to house emergency SCP storage and a backup of the SCP database.'),
  (5, '08/14/2003', 'A regional power outage leaves Site-62 without light for fifty-three minutes; personnel report sensing unseen, humanoid-sized entities.')
) as v(position, event_date, body);

-- ---------------------------------------------------------------------
-- SCP-005 (Safe)
-- ---------------------------------------------------------------------
insert into public.scp_subjects (item, object_class_id, summary, image_url, image_alt, owner_id)
values (
  'SCP-005',
  (select id from public.object_classes where name = 'Safe'),
  'An ornate key with the anomalous ability to open nearly any lock, mechanical or digital.',
  'https://cpubzanyrlsbmqasawdm.supabase.co/storage/v1/object/public/scp-images/seed/scp-005.png',
  'SCP-005 ornate universal key',
  null
);

-- Special Containment Procedures
insert into public.containment_procedures (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-005'), v.position, v.body
from (values
  (1, 'SCP-005 poses no immediate risk in any direct sense. Even so, its unique functions require special measures be taken to restrict access and manipulation of the object. Approval of at least one (1) Level 4 personnel is required for the removal of the object from its containment area.')
) as v(position, body);

-- Description
insert into public.descriptions (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-005'), v.position, v.body
from (values
  (1, 'In appearance, SCP-005 resembles an ornate key, displaying the characteristics of a typical mass produced key used in the 1920s. The key was discovered when a civilian used it to infiltrate a high security facility. SCP-005 seems to have the unique ability to open any and all forms of lock, be they mechanical or digital, with relative ease. The origin of this ability has yet to be determined.')
) as v(position, body);

-- Additional Notes
insert into public.additional_notes (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-005'), v.position, v.body
from (values
  (1, 'SCP-005 may be used as a replacement for lost security passes, but only under the supervision of at least one (1) Level 4 personnel. SCP-005 may not be used for vending machine repairs, opening lockers, or for any personnel''s spare home key. Removal of the object from the compound will result in immediate termination.')
) as v(position, body);

-- Appendix
insert into public.appendices (subject_id, title, body)
values ((select id from public.scp_subjects where item = 'SCP-005'), 'Appendix A', 'While SCP-005 has been shown to be effective in removing almost any form of locking device, further experiments have shown that efforts to disguise the purpose or identity of a lock have proven at least somewhat successful in defeating SCP-005''s ability. In approximately 50% of cases where a volunteer was not able to identify a locking device as such, SCP-005 was not successful in deactivating the device. Due to these results, SCP-005 has been tentatively classified as ''sentient'' and further tests are being run to determine its cognitive abilities.');

-- ---------------------------------------------------------------------
-- SCP-006 (Safe)
-- ---------------------------------------------------------------------
insert into public.scp_subjects (item, object_class_id, summary, image_url, image_alt, owner_id)
values (
  'SCP-006',
  (select id from public.object_classes where name = 'Safe'),
  'A small spring whose water grants extreme regenerative and immune-enhancing effects in humans.',
  'https://cpubzanyrlsbmqasawdm.supabase.co/storage/v1/object/public/scp-images/seed/scp-006.jpg',
  'SCP-006 spring water source',
  null
);

-- Special Containment Procedures
insert into public.containment_procedures (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-006'), v.position, v.body
from (values
  (1, 'Whereas the nature of SCP-006 does not warrant any extensive containment, a certain level of secrecy is necessary regarding the object''s existence and properties. The following procedures are required not for personnel safety, but to deny or hide knowledge of SCP-006''s effects from the personnel who interact with it.'),
  (2, 'All personnel interacting with SCP-006 in any physical way are required to wear modified Class VI BNC suits and be briefed with the correct clearance-restricted material before performing procedures.'),
  (3, 'Procedures with SCP-006 are to be carried out under extreme surveillance. In case of contact with SCP-006, the commander in charge will announce Procedure 006-Xi-12, briefed to personnel as meaning high toxicity is present and requiring evacuation.'),
  (4, 'Any procedure in which liquid is acquired from SCP-006 must be approved by three (3) O5 level personnel, and transferred in a Quad-Sealant Container under armed guard.'),
  (5, 'If at any time personnel come into contact with SCP-006 or liquid from SCP-006, they are to be confined and terminated after sufficient studies are done, most effectively by incineration.')
) as v(position, body);

-- Description
insert into public.descriptions (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-006'), v.position, v.body
from (values
  (1, 'SCP-006 is a very small spring located 60 km west of Astrakhan. Foundation Command was aware of its existence since the 19th century, but were unable to secure it until 1991 due to political reasons. On the spot of the spring, a chemical factory has been constructed as a disguise. The liquid emitted from the spring has been chemically identified as simple mineral water, but has the unusual property of "health".'),
  (2, 'Ingesting the liquid produces the following properties in human beings: the ability to regenerate DNA damaged by sufficient duplication, heightened excitement of cellular duplication, vastly improved abilities in the repair of damaged tissue, and a marked increase in the effectiveness of the human immune system. Many reptiles and birds were unaffected by the liquid, while higher primates experienced the same benefits as humans.')
) as v(position, body);

-- ---------------------------------------------------------------------
-- SCP-007 (Euclid)
-- ---------------------------------------------------------------------
insert into public.scp_subjects (item, object_class_id, summary, image_url, image_alt, owner_id)
values (
  'SCP-007',
  (select id from public.object_classes where name = 'Euclid'),
  'A man whose abdomen contains a small, self-sustaining planet complete with oceans, weather and an apparent population.',
  'https://cpubzanyrlsbmqasawdm.supabase.co/storage/v1/object/public/scp-images/seed/scp-007.jpg',
  'SCP-007, a planet visible within a man''s abdomen',
  null
);

-- Special Containment Procedures
insert into public.containment_procedures (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-007'), v.position, v.body
from (values
  (1, 'SCP-007 is to be housed in a standard humanoid containment suite at Site-19, furnished to a comfortable residential standard. Subject is to be provided with three meals a day and is permitted reading material, a television and supervised recreation time. Subject''s diet must exclude carbonated drinks, which have been observed to cause severe storms on the surface of the planet.'),
  (2, 'Medical staff are to examine the planet once per week using non-invasive imaging only. Under no circumstances is any instrument to be inserted into SCP-007''s abdomen without written approval from two (2) Level 4 personnel.')
) as v(position, body);

-- Description
insert into public.descriptions (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-007'), v.position, v.body
from (values
  (1, 'SCP-007 is a male of approximately 40 years of age with an unremarkable medical history. In place of the front wall of the abdomen and most of the abdominal organs, subject''s torso holds a roughly spherical planet approximately 30 cm in diameter. The planet has oceans, continents, polar ice caps and a working weather system, and rotates once every [DATA REDACTED] hours.'),
  (2, 'High-magnification imaging has revealed what appear to be cities on the night side of the planet, suggesting an inhabited world with technology comparable to the mid-twentieth century. Subject reports no discomfort and states that the planet "has always been there". Subject continues to digest food normally, although by what route is unknown.'),
  (3, 'Subject''s navel acts as a small opening onto the planet''s upper atmosphere. Objects passed through it fall towards the surface and are not recovered.')
) as v(position, body);

-- Additional Notes
insert into public.additional_notes (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-007'), v.position, v.body
from (values
  (1, 'Attempts to collect samples from the planet''s surface have caused sudden, violent weather and a sharp drop in subject''s blood pressure. All sampling has been suspended pending review.')
) as v(position, body);

-- ---------------------------------------------------------------------
-- SCP-008 (Keter)
-- ---------------------------------------------------------------------
insert into public.scp_subjects (item, object_class_id, summary, image_url, image_alt, owner_id)
values (
  'SCP-008',
  (select id from public.object_classes where name = 'Keter'),
  'A prion-based infection, stored in a sealed laboratory, that kills its host within hours and reanimates the body as an aggressive carrier.',
  'https://cpubzanyrlsbmqasawdm.supabase.co/storage/v1/object/public/scp-images/seed/scp-008.jpg',
  'SCP-008 sample vials in a sealed biohazard laboratory',
  null
);

-- Special Containment Procedures
insert into public.containment_procedures (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-008'), v.position, v.body
from (values
  (1, 'All samples of SCP-008 are to be kept in a sealed Biosafety Level 4 laboratory at Site-[DATA REDACTED], inside a two-layer containment vault. The vault is wired to a thermonuclear failsafe capable of destroying the facility should a breach be confirmed and judged uncontainable.'),
  (2, 'Personnel entering the laboratory must wear Level A hazmat suits and pass through a full decontamination cycle on exit. No more than two (2) researchers may handle samples at once, and all work must be observed remotely by a Level 4 supervisor with authority to begin lockdown.'),
  (3, 'Any person suspected of exposure is to be isolated immediately and monitored for seventy-two (72) hours. Confirmed cases are to be terminated and incinerated.')
) as v(position, body);

-- Description
insert into public.descriptions (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-008'), v.position, v.body
from (values
  (1, 'SCP-008 is a prion capable of infecting any mammal. Infection spreads through contact with bodily fluids, most often by bite. Within minutes the host develops a high fever and confusion, followed by rapid decay of the skin and internal organs.'),
  (2, 'Death occurs within four to seven hours, after which the body reanimates. Reanimated hosts show no higher brain function, feel no pain and attack any uninfected living creature nearby. They continue to decay and become inactive after approximately two weeks.'),
  (3, 'The original sample was recovered from [DATA REDACTED] following the loss of all personnel at that site. No cure has been found.')
) as v(position, body);

-- Addenda (author_id NULL: original file content, not written by a user).
-- created_at is staggered by position so they display in their original order.
insert into public.addenda (subject_id, author_id, title, body, created_at)
select (select id from public.scp_subjects where item = 'SCP-008'), null, v.title, v.body, now() + v.position * interval '1 second'
from (values
  (1, 'Addendum 008-01', 'Following a containment breach at Site-[DATA REDACTED] during which the failsafe failed to activate, all SCP-008 failsafe systems are now tested monthly. The breach was contained by Mobile Task Force units with the loss of [DATA REDACTED] personnel.')
) as v(position, title, body);

-- ---------------------------------------------------------------------
-- SCP-009 (Euclid)
-- ---------------------------------------------------------------------
insert into public.scp_subjects (item, object_class_id, summary, image_url, image_alt, owner_id)
values (
  'SCP-009',
  (select id from public.object_classes where name = 'Euclid'),
  'A red, water-like liquid that freezes when warmed and melts when cooled, turning any water it touches into more of itself.',
  'https://cpubzanyrlsbmqasawdm.supabase.co/storage/v1/object/public/scp-images/seed/scp-009.jpg',
  'SCP-009, a block of red ice in an insulated container',
  null
);

-- Special Containment Procedures
insert into public.containment_procedures (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-009'), v.position, v.body
from (values
  (1, 'SCP-009 is to be stored in a sealed, insulated container kept at a constant 0°C at all times. The container must be lined with a material containing no water and kept away from all sources of moisture.'),
  (2, 'Personnel handling SCP-009 must wear fully sealed suits. Any person exposed to SCP-009 must be moved immediately to a refrigerated isolation chamber held below -20°C.')
) as v(position, body);

-- Description
insert into public.descriptions (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-009'), v.position, v.body
from (values
  (1, 'SCP-009 resembles water but is a deep red color and behaves in reverse to normal water: it freezes at temperatures above 0°C and becomes liquid below it.'),
  (2, 'Any water in contact with SCP-009 is converted into SCP-009 over several minutes. Exposure of living tissue causes the water in the body to convert, resulting in internal freezing and death. The bodies of victims become a further source of contamination.'),
  (3, 'SCP-009 was recovered from a frozen lake in [DATA REDACTED] following the disappearance of a local ice-fishing team.')
) as v(position, body);

-- Chronology (dates written DD/MM/YYYY)
insert into public.chronology_entries (subject_id, position, event_date, body)
select (select id from public.scp_subjects where item = 'SCP-009'), v.position, to_date(v.event_date, 'DD/MM/YYYY'), v.body
from (values
  (1, '14/01/1993', 'A local ice-fishing team of four is reported missing near Lake [DATA REDACTED]. Search teams find the surface of the lake stained red.'),
  (2, '16/01/1993', 'Foundation agents posing as environmental inspectors seal off the lake and begin recovery of SCP-009.'),
  (3, '02/02/1993', 'Recovery is completed. The remaining lake water is pumped into refrigerated storage and the lakebed is lined with concrete.')
) as v(position, event_date, body);

-- ---------------------------------------------------------------------
-- SCP-010 (Safe)
-- ---------------------------------------------------------------------
insert into public.scp_subjects (item, object_class_id, summary, image_url, image_alt, owner_id)
values (
  'SCP-010',
  (select id from public.object_classes where name = 'Safe'),
  'A set of metal collars that let whoever holds the paired control unit take over the movements of the wearer.',
  'https://cpubzanyrlsbmqasawdm.supabase.co/storage/v1/object/public/scp-images/seed/scp-010.jpg',
  'SCP-010, metal collars beside a handheld control unit',
  null
);

-- Special Containment Procedures
insert into public.containment_procedures (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-010'), v.position, v.body
from (values
  (1, 'The SCP-010 collars and their control unit are to be stored in two separate locked lockers at Site-[DATA REDACTED]. The control unit must never be kept in the same room as any collar.'),
  (2, 'Testing requires the approval of a Level 3 researcher and may only be carried out on Class D personnel. The person operating the control unit must be accompanied by at least one armed guard.')
) as v(position, body);

-- Description
insert into public.descriptions (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-010'), v.position, v.body
from (values
  (1, 'SCP-010 is a set of six (6) metal collars and a single handheld control unit fitted with a joystick, buttons and a small display. When a collar is fitted, it locks itself closed and cannot be removed without the control unit.'),
  (2, 'The holder of the control unit can direct the movements of anyone wearing a collar, overriding their control of their own body. Wearers remain fully conscious and aware throughout, and report severe distress.'),
  (3, 'The collars were recovered from a private compound belonging to [DATA REDACTED]. Of the original eight (8) collars, two are unaccounted for.')
) as v(position, body);

-- Reference
insert into public.subject_references (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-010'), v.position, v.body
from (values
  (1, 'Two collars remain missing. Any reports of people acting against their will in a mechanical, puppet-like manner are to be forwarded to Foundation agents for investigation.')
) as v(position, body);

-- ---------------------------------------------------------------------
-- SCP-011 (Safe)
-- ---------------------------------------------------------------------
insert into public.scp_subjects (item, object_class_id, summary, image_url, image_alt, owner_id)
values (
  'SCP-011',
  (select id from public.object_classes where name = 'Safe'),
  'A bronze Civil War memorial statue in a small town square that walks at night, keeps watch over the town and has a strong dislike of pigeons.',
  'https://cpubzanyrlsbmqasawdm.supabase.co/storage/v1/object/public/scp-images/seed/scp-011.jpg',
  'SCP-011, a bronze soldier statue on a granite plinth',
  null
);

-- Special Containment Procedures
insert into public.containment_procedures (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-011'), v.position, v.body
from (values
  (1, 'SCP-011 is contained in place in the town square of Woodstock, Vermont. Foundation agents posing as members of the local historical society maintain the statue and the surrounding park.'),
  (2, 'Agents are to clean the statue of bird droppings each morning before 07:00 local time and are to report any change in its position. The statue''s rifle is to be checked monthly to confirm it holds no live ammunition.')
) as v(position, body);

-- Description
insert into public.descriptions (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-011'), v.position, v.body
from (values
  (1, 'SCP-011 is a bronze statue of a Union soldier, mounted on a granite plinth and dedicated in 1866 to the town''s war dead. Each night between approximately 01:00 and 04:00, the statue climbs down from its plinth and walks around the town square.'),
  (2, 'During these periods SCP-011 has been observed throwing stones at pigeons, cleaning its own uniform and standing at attention facing south. It returns to its plinth before dawn in its original pose.'),
  (3, 'SCP-011 has never harmed a person. Local residents know of a story that the statue "keeps watch" but regard it as folklore.')
) as v(position, body);

-- Additional Notes
insert into public.additional_notes (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-011'), v.position, v.body
from (values
  (1, 'An attempt to move SCP-011 to a Foundation site in 1989 was abandoned after the statue returned to the town square overnight, despite being held in a locked shipping container.')
) as v(position, body);

-- ---------------------------------------------------------------------
-- SCP-012 (Euclid)
-- ---------------------------------------------------------------------
insert into public.scp_subjects (item, object_class_id, summary, image_url, image_alt, owner_id)
values (
  'SCP-012',
  (select id from public.object_classes where name = 'Euclid'),
  'An unfinished sheet of music titled "On Mount Golgotha" that compels anyone who reads it to complete the piece in their own blood.',
  'https://cpubzanyrlsbmqasawdm.supabase.co/storage/v1/object/public/scp-images/seed/scp-012.jpg',
  'SCP-012, an aged sheet of handwritten music',
  null
);

-- Special Containment Procedures
insert into public.containment_procedures (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-012'), v.position, v.body
from (values
  (1, 'SCP-012 is to be kept in a sealed vault at Site-19, inside a locked, opaque folder. No personnel may view the score directly; all study must be carried out using remote cameras, with images shown at reduced resolution.'),
  (2, 'Any person exposed to SCP-012 is to be restrained immediately and kept under medical supervision until the compulsion passes, usually within twelve (12) hours.')
) as v(position, body);

-- Description
insert into public.descriptions (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-012'), v.position, v.body
from (values
  (1, 'SCP-012 is a handwritten musical score on aged paper, titled "On Mount Golgotha". Roughly a third of the composition is written in red and black ink; the rest is unfinished.'),
  (2, 'Any person who views the score becomes compelled to complete it, using their own blood as ink. Subjects typically injure themselves to do so and have continued until they lose consciousness or die from blood loss. Those who survive describe the piece as "impossible" to finish correctly.'),
  (3, 'SCP-012 was recovered during an archaeological excavation in northern Italy in 1997, beside the remains of [DATA REDACTED].')
) as v(position, body);

-- Field report (the report row first, then its entries linked to it)
insert into public.field_reports (subject_id, title, intro)
values ((select id from public.scp_subjects where item = 'SCP-012'), 'Recovery Report — Excavation Site [DATA REDACTED]', 'The following entries are taken from the recovery team''s log.');

insert into public.field_report_entries (field_report_id, position, body)
select fr.id, v.position, v.body
from public.field_reports fr
cross join (values
  (1, 'Day 1: The tomb is opened. A folder of sheet music is found beside the remains, wrapped in oilcloth.'),
  (2, 'Day 1: Two members of the excavation team are found unconscious beside the folder with self-inflicted wounds to the arms. The score has been added to in fresh blood.'),
  (3, 'Day 2: The folder is sealed by agents wearing blindfolds and transferred to Site-19.')
) as v(position, body)
where fr.subject_id = (select id from public.scp_subjects where item = 'SCP-012');

-- ---------------------------------------------------------------------
-- SCP-013 (Safe)
-- ---------------------------------------------------------------------
insert into public.scp_subjects (item, object_class_id, summary, image_url, image_alt, owner_id)
values (
  'SCP-013',
  (select id from public.object_classes where name = 'Safe'),
  'A pack of "Blue Lady" cigarettes whose smokers develop recurring dreams of a woman in blue and come to believe her memories are their own.',
  'https://cpubzanyrlsbmqasawdm.supabase.co/storage/v1/object/public/scp-images/seed/scp-013.jpg',
  'SCP-013, an old pack of cigarettes with a blue label',
  null
);

-- Special Containment Procedures
insert into public.containment_procedures (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-013'), v.position, v.body
from (values
  (1, 'The remaining SCP-013 cigarettes are to be kept in a locked, humidity-controlled cabinet at Site-[DATA REDACTED]. Each cigarette must be signed out by a Level 2 researcher and its use logged.'),
  (2, 'Personnel who have smoked an SCP-013 cigarette are to attend a psychological evaluation every week for one month afterwards.')
) as v(position, body);

-- Description
insert into public.descriptions (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-013'), v.position, v.body
from (values
  (1, 'SCP-013 is a pack of cigarettes branded "Blue Lady", of which [DATA REDACTED] remain. Apart from a faint smell of lilac, they are chemically identical to an ordinary brand of cigarette.'),
  (2, 'Subjects who smoke an SCP-013 cigarette report vivid, recurring dreams of a woman in a blue dress. Over the following weeks, subjects begin to recall events from this woman''s life as their own memories, including places they have never visited.'),
  (3, 'No historical record has been found of the woman described, despite the consistency of the details given by different subjects.')
) as v(position, body);

-- ---------------------------------------------------------------------
-- SCP-014 (Safe) - original subject, not adapted from the SCP Wiki
-- ---------------------------------------------------------------------
insert into public.scp_subjects (item, object_class_id, summary, image_url, image_alt, owner_id)
values (
  'SCP-014',
  (select id from public.object_classes where name = 'Safe'),
  'A brass-framed lighthouse lens that, when lit, projects images of ships lost at sea onto any surface it faces.',
  'https://cpubzanyrlsbmqasawdm.supabase.co/storage/v1/object/public/scp-images/seed/scp-014.jpg',
  'SCP-014, a large glass lighthouse lens in a brass frame',
  null
);

-- Special Containment Procedures
insert into public.containment_procedures (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-014'), v.position, v.body
from (values
  (1, 'SCP-014 is to be stored in a dark, locked room at Site-[DATA REDACTED] under a fitted cloth cover. It must not be exposed to any light source brighter than a standard flashlight.'),
  (2, 'Testing requires approval from a Level 2 researcher and must take place in a dark room facing a blank white wall.')
) as v(position, body);

-- Description
insert into public.descriptions (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-014'), v.position, v.body
from (values
  (1, 'SCP-014 is a glass lens of the type once used in coastal lighthouses, 1.2 m tall and set in a brass frame. It shows wear consistent with use from the late nineteenth century.'),
  (2, 'When a light is placed inside SCP-014, it projects moving images onto any surface it faces. The images show ships at sea in poor weather and always end with the ship sinking. Of the ships identified so far, every one is recorded as lost at sea.'),
  (3, 'Some of the projected ships have not yet been identified. Researchers are investigating whether any match ships still in service.')
) as v(position, body);

-- Addenda (author_id NULL: original file content, not written by a user).
-- created_at is staggered by position so they display in their original order.
insert into public.addenda (subject_id, author_id, title, body, created_at)
select (select id from public.scp_subjects where item = 'SCP-014'), null, v.title, v.body, now() + v.position * interval '1 second'
from (values
  (1, 'Addendum 014-01', 'On [DATA REDACTED], SCP-014 projected a ship matching a cargo vessel then at sea. The vessel was reported lost eleven days later. Further testing is suspended pending review by the Ethics Committee.')
) as v(position, title, body);

-- ---------------------------------------------------------------------
-- SCP-015 (Keter)
-- ---------------------------------------------------------------------
insert into public.scp_subjects (item, object_class_id, summary, image_url, image_alt, owner_id)
values (
  'SCP-015',
  (select id from public.object_classes where name = 'Keter'),
  'A sprawling, self-extending network of pipes inside an abandoned factory that grows into nearby buildings and harms anyone who tampers with it.',
  'https://cpubzanyrlsbmqasawdm.supabase.co/storage/v1/object/public/scp-images/seed/scp-015.jpg',
  'SCP-015, a dense tangle of pipes inside a factory',
  null
);

-- Special Containment Procedures
insert into public.containment_procedures (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-015'), v.position, v.body
from (values
  (1, 'SCP-015 is contained in place within the [DATA REDACTED] Pipe and Supply factory. The surrounding block has been bought by a Foundation front company, and a 50 m buffer zone of empty land is kept around the building.'),
  (2, 'The extent of SCP-015 is to be mapped weekly by remote drone. No personnel may enter the building without written approval from the site director, and never alone.'),
  (3, 'Any extension of SCP-015 found outside the factory is to be reported immediately. Under no circumstances are pipes to be cut, welded or opened.')
) as v(position, body);

-- Description
insert into public.descriptions (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-015'), v.position, v.body
from (values
  (1, 'SCP-015 is a collection of pipes and fittings of various materials and sizes that fills the interior of a former pipe factory. The pipes extend and branch on their own, and have grown through the factory walls into the surrounding ground.'),
  (2, 'When any part of SCP-015 is damaged, pipes nearby burst and release liquid at high pressure. The liquid has included water, sewage, oil and, on several occasions, human blood. Personnel caught in these releases have been seriously injured or killed.'),
  (3, 'The factory was closed in 1980 after its night shift disappeared. SCP-015 now covers roughly [DATA REDACTED] square meters.')
) as v(position, body);

-- Chronology (dates written DD/MM/YYYY)
insert into public.chronology_entries (subject_id, position, event_date, body)
select (select id from public.scp_subjects where item = 'SCP-015'), v.position, to_date(v.event_date, 'DD/MM/YYYY'), v.body
from (values
  (1, '12/03/1980', 'Eleven night-shift workers at the factory are reported missing. The factory is closed.'),
  (2, '30/06/1984', 'A demolition crew attempts to cut into the pipework. Seven of the eight crew members are killed when the pipes burst.'),
  (3, '05/07/1984', 'The Foundation buys the site and sets up the buffer zone.')
) as v(position, event_date, body);

-- ---------------------------------------------------------------------
-- SCP-016 (Keter)
-- ---------------------------------------------------------------------
insert into public.scp_subjects (item, object_class_id, summary, image_url, image_alt, owner_id)
values (
  'SCP-016',
  (select id from public.object_classes where name = 'Keter'),
  'A micro-organism that slowly rebuilds any host''s body into new, unknown tissue while keeping the host alive and aware.',
  'https://cpubzanyrlsbmqasawdm.supabase.co/storage/v1/object/public/scp-images/seed/scp-016.jpg',
  'SCP-016 under a microscope',
  null
);

-- Special Containment Procedures
insert into public.containment_procedures (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-016'), v.position, v.body
from (values
  (1, 'SCP-016 is to be kept in a sealed, airtight Biosafety Level 4 laboratory at Site-[DATA REDACTED]. All samples are stored in double-walled containers at -80°C.'),
  (2, 'Infected subjects are to be held in sealed isolation chambers with no shared air supply. All waste from these chambers is to be incinerated.')
) as v(position, body);

-- Description
insert into public.descriptions (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-016'), v.position, v.body
from (values
  (1, 'SCP-016 is a micro-organism with features of both a virus and a bacterium. It can infect any multicellular organism and spreads through bodily fluids.'),
  (2, 'Once infected, the host''s cells are gradually replaced with an unknown type of tissue. The host stays alive throughout and, in human cases, conscious. The final form of an infected host has not been observed, as the process has continued for over [DATA REDACTED] months without completing.'),
  (3, 'SCP-016 appears to respond to its surroundings. Samples move away from heat and towards nearby living tissue, and separate samples have shown coordinated behavior.')
) as v(position, body);

-- Additional Notes
insert into public.additional_notes (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-016'), v.position, v.body
from (values
  (1, 'Research into SCP-016 is limited to remote observation following an incident in which a sealed container was found to have been breached from the inside.')
) as v(position, body);

-- ---------------------------------------------------------------------
-- SCP-017 (Keter)
-- ---------------------------------------------------------------------
insert into public.scp_subjects (item, object_class_id, summary, image_url, image_alt, owner_id)
values (
  'SCP-017',
  (select id from public.object_classes where name = 'Keter'),
  'A humanoid shadow that envelops and erases any living creature that is not fully surrounded by light.',
  'https://cpubzanyrlsbmqasawdm.supabase.co/storage/v1/object/public/scp-images/seed/scp-017.jpg',
  'SCP-017, a dark humanoid shape in a brightly lit chamber',
  null
);

-- Special Containment Procedures
insert into public.containment_procedures (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-017'), v.position, v.body
from (values
  (1, 'SCP-017 is to be held in a 10 m × 10 m × 10 m chamber with lights set into every surface, keeping the room fully lit at all times. The chamber has three independent power supplies, and its lights must never fall below full brightness.'),
  (2, 'Personnel entering the chamber must carry at least two working light sources and must not cast a shadow towards SCP-017. Testing is permitted only with the approval of two (2) Level 4 personnel.')
) as v(position, body);

-- Description
insert into public.descriptions (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-017'), v.position, v.body
from (values
  (1, 'SCP-017 is a humanoid figure approximately 1.4 m tall that appears to be made of shadow. It does not reflect light and cannot be photographed in detail.'),
  (2, 'When a living creature stands within any shadow, including its own, SCP-017 moves towards it and envelops it. Once fully covered, the creature disappears completely, leaving no remains. SCP-017 cannot enter areas of full light.'),
  (3, 'SCP-017 has shown no interest in communication. It remains still in the center of its chamber when no living creature is present.')
) as v(position, body);

-- Chronology (dates written DD/MM/YYYY)
insert into public.chronology_entries (subject_id, position, event_date, body)
select (select id from public.scp_subjects where item = 'SCP-017'), v.position, to_date(v.event_date, 'DD/MM/YYYY'), v.body
from (values
  (1, '08/10/1979', 'SCP-017 is recovered from [DATA REDACTED] after a series of disappearances at a closed theater.'),
  (2, '21/04/1995', 'Two of the chamber''s three power supplies fail, leaving the chamber partly lit for forty seconds. One researcher is lost.'),
  (3, '22/04/1995', 'The chamber lighting is upgraded to the current specification.')
) as v(position, event_date, body);

-- ---------------------------------------------------------------------
-- SCP-018 (Euclid)
-- ---------------------------------------------------------------------
insert into public.scp_subjects (item, object_class_id, summary, image_url, image_alt, owner_id)
values (
  'SCP-018',
  (select id from public.object_classes where name = 'Euclid'),
  'A red rubber ball that bounces back with more energy than it hit with, growing faster and more destructive with every impact.',
  'https://cpubzanyrlsbmqasawdm.supabase.co/storage/v1/object/public/scp-images/seed/scp-018.jpg',
  'SCP-018, a small red rubber ball in a padded box',
  null
);

-- Special Containment Procedures
insert into public.containment_procedures (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-018'), v.position, v.body
from (values
  (1, 'SCP-018 is to be kept in a 5 m × 5 m chamber lined with padding. When not being tested, it must be held at rest in a reinforced box filled with a soft, energy-absorbing gel.'),
  (2, 'Testing must be carried out inside the chamber with all personnel outside. SCP-018 must be released with minimal force, by dropping it from no more than 2 cm.')
) as v(position, body);

-- Description
insert into public.descriptions (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-018'), v.position, v.body
from (values
  (1, 'SCP-018 is a red rubber ball, 6 cm in diameter, that looks like a children''s toy. When it strikes a surface it rebounds with roughly twice the energy it arrived with.'),
  (2, 'Because each bounce adds energy, SCP-018 quickly reaches extreme speeds in any enclosed space and can pass through concrete and steel. It loses energy only when it hits a soft enough surface or flies into open space.'),
  (3, 'SCP-018 was recovered after an incident at a school in [DATA REDACTED], where a single throw destroyed part of a gymnasium.')
) as v(position, body);

-- Addenda (author_id NULL: original file content, not written by a user).
-- created_at is staggered by position so they display in their original order.
insert into public.addenda (subject_id, author_id, title, body, created_at)
select (select id from public.scp_subjects where item = 'SCP-018'), null, v.title, v.body, now() + v.position * interval '1 second'
from (values
  (1, 'Addendum 018-01', 'Following an incident at Site-[DATA REDACTED], during which SCP-018 passed through three floors before being stopped by a stack of mattresses, dropping SCP-018 from a height greater than 2 cm is forbidden.'),
  (2, 'Addendum 018-02', 'A request by Dr. [DATA REDACTED] to use SCP-018 as a power source has been denied.')
) as v(position, title, body);

-- ---------------------------------------------------------------------
-- SCP-019 (Keter)
-- ---------------------------------------------------------------------
insert into public.scp_subjects (item, object_class_id, summary, image_url, image_alt, owner_id)
values (
  'SCP-019',
  (select id from public.object_classes where name = 'Keter'),
  'A large painted clay vase that periodically releases unknown, hostile creatures from its apparently bottomless interior.',
  'https://cpubzanyrlsbmqasawdm.supabase.co/storage/v1/object/public/scp-images/seed/scp-019.jpg',
  'SCP-019, a tall painted clay vase',
  null
);

-- Special Containment Procedures
insert into public.containment_procedures (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-019'), v.position, v.body
from (values
  (1, 'SCP-019 is to be kept in a 15 m × 15 m reinforced chamber at Site-[DATA REDACTED], with automated weapons trained on its opening. The chamber walls must be at least 1 m thick.'),
  (2, 'Two armed guards are to watch SCP-019 by camera at all times. Any creature leaving SCP-019 is to be killed immediately and the remains sent for study.')
) as v(position, body);

-- Description
insert into public.descriptions (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-019'), v.position, v.body
from (values
  (1, 'SCP-019 is a clay vase approximately 1.5 m tall, painted with figures of animals and people. Its opening is 30 cm wide. No bottom can be seen or reached; probes lowered into it have found no end.'),
  (2, 'At irregular intervals SCP-019 releases creatures from its opening. No two have been alike, but all have been hostile to humans. Some creatures have been far too large to pass through the opening, yet emerged regardless.'),
  (3, 'SCP-019 was found in the cellar of a farmhouse in [DATA REDACTED], beside the remains of its previous owner.')
) as v(position, body);

-- Reference
insert into public.subject_references (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-019'), v.position, v.body
from (values
  (1, 'Over [DATA REDACTED] creatures have now been released. The interval between releases has been shortening over the last decade.')
) as v(position, body);

-- ---------------------------------------------------------------------
-- SCP-020 (Keter)
-- ---------------------------------------------------------------------
insert into public.scp_subjects (item, object_class_id, summary, image_url, image_alt, owner_id)
values (
  'SCP-020',
  (select id from public.object_classes where name = 'Keter'),
  'An airborne mold that infects living hosts unnoticed and changes their behavior so that they spread it to others.',
  'https://cpubzanyrlsbmqasawdm.supabase.co/storage/v1/object/public/scp-images/seed/scp-020.jpg',
  'SCP-020, gray mold growing on a wall',
  null
);

-- Special Containment Procedures
insert into public.containment_procedures (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-020'), v.position, v.body
from (values
  (1, 'SCP-020 is contained in place in a house in [DATA REDACTED], which has been sealed and placed under negative air pressure. A 100 m exclusion zone is maintained and presented to the public as a gas leak.'),
  (2, 'Personnel entering the house must wear sealed suits with an independent air supply, and must be decontaminated and quarantined for fourteen (14) days afterwards.')
) as v(position, body);

-- Description
insert into public.descriptions (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-020'), v.position, v.body
from (values
  (1, 'SCP-020 is a mold whose spores are too small to be seen. It grows on any surface but prefers living hosts, on which it causes no symptoms in the early stages.'),
  (2, 'Infected hosts gradually change their behavior in ways that spread SCP-020: they open windows, cough or sneeze near others, and visit crowded places more often. Hosts are not aware of this change.'),
  (3, 'In later stages the mold becomes visible as gray patches on the skin. By this time the host has usually infected several others.')
) as v(position, body);

-- Appendix
insert into public.appendices (subject_id, title, body)
values ((select id from public.scp_subjects where item = 'SCP-020'), 'Appendix A', 'An outbreak of SCP-020 at a nearby school was contained after [DATA REDACTED] students and staff were found to be infected. A cover story of a ventilation fault was used to explain the closure.');

-- ---------------------------------------------------------------------
-- SCP-021 (Euclid)
-- ---------------------------------------------------------------------
insert into public.scp_subjects (item, object_class_id, summary, image_url, image_alt, owner_id)
values (
  'SCP-021',
  (select id from public.object_classes where name = 'Euclid'),
  'A worm-like creature that lives in a host''s skin, appearing as a moving tattoo and passing from host to host through touch.',
  'https://cpubzanyrlsbmqasawdm.supabase.co/storage/v1/object/public/scp-images/seed/scp-021.jpg',
  'SCP-021, a serpent-shaped tattoo on a person''s arm',
  null
);

-- Special Containment Procedures
insert into public.containment_procedures (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-021'), v.position, v.body
from (values
  (1, 'SCP-021 is to be kept in its current host, a Class D subject, held in a standard humanoid containment cell at Site-19. The host is to be replaced every thirty (30) days, or sooner if their health declines.'),
  (2, 'Transfer to a new host is to be carried out only under medical supervision. Personnel must wear gloves at all times when near the host.')
) as v(position, body);

-- Description
insert into public.descriptions (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-021'), v.position, v.body
from (values
  (1, 'SCP-021 appears as a tattoo of a long, serpent-like creature on its host''s skin. It moves across the host''s body, usually at night, and can reach any part of the skin.'),
  (2, 'Hosts report itching and mild pain while SCP-021 moves. After roughly thirty days, hosts become weak and lose weight, as SCP-021 appears to feed on them.'),
  (3, 'SCP-021 can pass to another person through prolonged skin contact. It always moves to a new host when the current host''s health becomes poor.')
) as v(position, body);

-- Additional Notes
insert into public.additional_notes (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-021'), v.position, v.body
from (values
  (1, 'SCP-021 was recovered from a tattoo parlor in [DATA REDACTED]. The artist who owned the parlor has not been located.')
) as v(position, body);

commit;

-- ---------------------------------------------------------------------
-- Check: select and run this query on its own afterwards (remove the --).
-- Expected result, one row per subject:
--
--   item     class   containment description reference notes chronology field_report_entries addenda
--   SCP-002  Euclid       3          2           1       0        0              6              0
--   SCP-003  Euclid       4          7           0       0        0              0              5
--   SCP-004  Euclid       2          3           1       0        5              0              0
--   SCP-005  Safe         1          1           0       1        0              0              0
--   SCP-006  Safe         5          2           0       0        0              0              0
--   SCP-007  Euclid       2          3           0       1        0              0              0
--   SCP-008  Keter        3          3           0       0        0              0              1
--   SCP-009  Euclid       2          3           0       0        3              0              0
--   SCP-010  Safe         2          3           1       0        0              0              0
--   SCP-011  Safe         2          3           0       1        0              0              0
--   SCP-012  Euclid       2          3           0       0        0              3              0
--   SCP-013  Safe         2          3           0       0        0              0              0
--   SCP-014  Safe         2          3           0       0        0              0              1
--   SCP-015  Keter        3          3           0       0        3              0              0
--   SCP-016  Keter        2          3           0       1        0              0              0
--   SCP-017  Keter        2          3           0       0        3              0              0
--   SCP-018  Euclid       2          3           0       0        0              0              2
--   SCP-019  Keter        2          3           1       0        0              0              0
--   SCP-020  Keter        2          3           0       0        0              0              0
--   SCP-021  Euclid       2          3           0       1        0              0              0
-- ---------------------------------------------------------------------
-- select s.item,
--        c.name as class,
--        (select count(*) from public.containment_procedures x where x.subject_id = s.id) as containment,
--        (select count(*) from public.descriptions x where x.subject_id = s.id) as description,
--        (select count(*) from public.subject_references x where x.subject_id = s.id) as reference,
--        (select count(*) from public.additional_notes x where x.subject_id = s.id) as notes,
--        (select count(*) from public.chronology_entries x where x.subject_id = s.id) as chronology,
--        (select count(*) from public.field_report_entries x
--           join public.field_reports f on f.id = x.field_report_id
--          where f.subject_id = s.id) as field_report_entries,
--        (select count(*) from public.addenda x where x.subject_id = s.id) as addenda
-- from public.scp_subjects s
-- join public.object_classes c on c.id = s.object_class_id
-- order by s.item;
