import React, {useState} from "react";
import IPage from "../interfaces/page";
import {FlashCardDeck} from "../interfaces/flashcarddeck";
import {generateAllLinesDeck,} from "../applogic/pageHelpers/createDeckHelper";
import {generateNewDeck} from "../applogic/createDeck/createDeckMain";
import {CreateDeckData} from "../interfaces/createdeckdata";
import {CardOrder, InputTextType, WritingSystem} from "../interfaces/types/createDeckValues";

//skriv kode til at forbinde til endpoint /texttovocab, saa jeg kan downloade vocab fra raa text

const CreateDeck: React.FunctionComponent<IPage> = props => {
    const downloadDeckUrl: string = "https://chinesesentencemining-6z6zb.ondigitalocean.app/texttodeck"
    //const downloadDeckUrl: string = "http://127.0.0.1:5000/texttodeck"
    const downloadVocabInfoUrl: string = "https://chinesesentencemining-6z6zb.ondigitalocean.app/texttovocabinfo"
    //const downloadVocabInfoUrl: string = "http://127.0.0.1:5000/texttovocabinfo"
    const downloadVocabRawUrl: string = "https://chinesesentencemining-6z6zb.ondigitalocean.app/texttovocabraw"
    //const downloadVocabRawUrl: string = "http://127.0.0.1:5000/texttovocabraw"

    const [selectsLanguage, setSelectsLanguage] = useState<WritingSystem>(WritingSystem.SIMPLIFIED)
    const [sortorder, setsortorder] = useState<CardOrder>(CardOrder.CHRONOLOGICAL)
    const [textType, setTextType] = useState<InputTextType>(InputTextType.RAWTEXT)
    const [outputs, setOutputs] = useState<string>("")

    const download = (filename: string, text:string, isVocab: boolean, fileextension: string) => {
        const element = document.createElement('a');
        const dict = JSON.parse(text)
        var res = ""
        if (isVocab) {
            res = dict["output"]
        }else {
            res = text
        }
        const file = new Blob([res], {
            type: "text/plain;charset=utf-8"
        });
        element.href = URL.createObjectURL(file);
        element.download = filename + fileextension;
        document.body.appendChild(element);
        element.click();
    }

    //         console.log("save file code initiated")
    //         const element = document.createElement('a');
    //         const file = new Blob([text], {
    //             type: "text/plain;charset=utf-8",
    //         });
    //         element.href = URL.createObjectURL(file);
    //         element.download = filename + ".txt";
    //         document.body.appendChild(element);
    //         element.click();
    //         console.log("save file code executed")

    const handleVocabWithInfo = () => {
        handleVocab(downloadVocabInfoUrl)
    }

    //downloadVocabRawUrl
    const handleVocabRaw = () => {
        handleVocab(downloadVocabRawUrl)
    }

    const handleVocab = (endpint: string) => {
        const deckName: string = ((document.getElementById("deckName") as HTMLInputElement).value.trim());
        const deckInfo: string = ((document.getElementById("deckInfo") as HTMLInputElement).value.trim());
        const vocab: string = ((document.getElementById("vocab") as HTMLInputElement).value.trim());
        const text: string = ((document.getElementById("text") as HTMLInputElement).value.trim());
        if (isEmptyString(deckName) || isEmptyString(deckInfo) || isEmptyString(text)) {
            setOutputs("there is an error in in the input. make sure all fields are set")
        }
        const bodyDict = {
            "deckName": deckName,
            "deckInfo": deckInfo,
            "script": selectsLanguage,
            "cardOrder": sortorder,
            "vocab": vocab.split(/(\s+)/),
            "textType": textType,
            "sentencenames": [],
            "text": text.trim(),
        }
        const headers = new Headers();
        headers.append('Content-type', 'application/json');
        const options = {
            method: 'POST',
            headers,
            body: JSON.stringify(bodyDict)
        }
        fetch(endpint, options)
            .then(response => response.json())
            .then(data => {
                const res: string = JSON.stringify(data)
                if (res != null) {
                    setOutputs("no errors")
                    //setOutputs(res.toString())
                }
                download(deckName + "_vocab", res, true, ".json")
            })

    }

    const handleDownload = () => {
        const deckName: string = ((document.getElementById("deckName") as HTMLInputElement).value.trim());
        const deckInfo: string = ((document.getElementById("deckInfo") as HTMLInputElement).value.trim());
        const vocab: string = ((document.getElementById("vocab") as HTMLInputElement).value.trim());
        const text: string = ((document.getElementById("text") as HTMLInputElement).value.trim());
        if (isEmptyString(deckName) || isEmptyString(deckInfo) || isEmptyString(text)) {
            setOutputs("there is an error in in the input. make sure all fields are set")
        }
        const bodyDict: CreateDeckData = {
            "deckName": deckName,
            "deckInfo": deckInfo,
            "script": selectsLanguage,
            "cardOrder": sortorder,
            "vocab": vocab.split(/(\s+)/),
            "textType": textType,
            "sentencenames": [],
            "text": text.trim(),
        }

        if (selectsLanguage == WritingSystem.GENERIC && textType == InputTextType.ORDEREDLINESALL) {
            setOutputs("cards generated entirely from text (deck name and info must still be set)")
            const resultOfCardGeneration: FlashCardDeck = generateAllLinesDeck(text.trim(), deckName, deckInfo)
            const result: string = JSON.stringify(resultOfCardGeneration)
            download(deckName, result, false, ".json")
        }else {
            const headers = new Headers();
            headers.append('Content-type', 'application/json');
            const options = {
                method: 'POST',
                headers,
                body: JSON.stringify(bodyDict)
            }
            const res: FlashCardDeck = generateNewDeck(bodyDict)
            if (res != null) {
                setOutputs("no errors")
                //setOutputs(res.toString())
                download(deckName, JSON.stringify(res), false, ".json")
            }

            /*
            fetch(downloadDeckUrl, options)
                .then(response => response.json())
                .then(data => {
                    const res: string = JSON.stringify(data)
                    if (res != null) {
                        setOutputs("no errors")
                        //setOutputs(res.toString())
                    }
                    download(deckName, res, false)
                })
                */
        }
    }

    const isEmptyString = (data: string): boolean => typeof data === "string" && data.trim().length == 0;
    return (

        <section>
            <button type="button" onClick={() => handleDownload()}>text to deck</button>
            <button type="button" onClick={() => handleVocabWithInfo()}>text to vocab with info</button>
            <button type="button" onClick={() => handleVocabRaw()}>text to vocab raw</button>
            <form>
                <p>
                    <label htmlFor="deckName">deckName</label>
                    <textarea id="deckName" required rows={2}> </textarea>
                </p>
                <p>
                    <label htmlFor="deckInfo">deckInfo</label>
                    <textarea id="deckInfo" required rows={5}> </textarea>
                </p>

                <div>
                    <p>Currently, only simplified characters are supported. Traditional characters will be supported at
                        some point</p>
                    <p>value: {selectsLanguage}</p>
                    <select value={selectsLanguage} onChange={e => setSelectsLanguage(e.target.value as WritingSystem)}>
                        <option value={WritingSystem.SIMPLIFIED}>simplified</option>
                        <option value={WritingSystem.TRADITIONAL}>traditional</option>
                        <option value={WritingSystem.GENERIC}>generic</option>
                    </select>
                </div>

                <div>
                    <p>choose the orderings frequency: </p>
                    <p>value: {sortorder}</p>
                    <select value={sortorder} onChange={e => setsortorder(e.target.value as CardOrder)}>
                        <option value={CardOrder.CHRONOLOGICAL}>chronological</option>
                        <option value={CardOrder.FREQUENCY}>frequency</option>
                    </select>
                </div>
                <div>
                    <p>choose the type of text you want to input: </p>
                    <p>value: {textType}</p>
                    <select value={textType} onChange={e => setTextType(e.target.value as InputTextType)}>
                        <option value={InputTextType.RAWTEXT}>rawText</option>
                        <option value={InputTextType.ORDEREDLINESTWO}>ordered2Line</option>
                        <option value={InputTextType.ORDEREDLINESALL}>orderedAllLines</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="vocab">vocab</label>
                    <textarea id="vocab" required rows={2}> </textarea>
                </div>
                <div>
                    <p>Insert the chinese text in the Text box. The data will be downloaded to a file</p>
                    <label htmlFor="text">Text</label>
                    <textarea id="text" required rows={10}> </textarea>
                </div>
                <div>
                    <label htmlFor="output">output</label>
                    <p>value: {outputs}</p>
                    <textarea value={outputs} required rows={2}> </textarea>
                </div>
            </form>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
        </section>
    )
};
export default CreateDeck;

