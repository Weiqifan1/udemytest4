
import React, {ReactElement, useEffect, useRef, useState} from "react";
import IPage from "../interfaces/page";
import {useDispatch, useSelector} from "react-redux";
import {bindActionCreators} from "redux";
import { characterSRSactionCreators, previousCharactersActionCreators, showSecondaryFlashcardInfoActionCreator,  State } from '../state/index';
import {FlashCard} from "../interfaces/flashcard";
import {FlashCardDeck} from "../interfaces/flashcarddeck";
import characterSRSlogic from "../interfaces/characterSRSlogic";
import {calculateNextCharacter} from "../applogic/characterSRSlogic/calculateCharacterSRSorder/characterSRSlogicBoundary";
import CardComponent from "../components/CardComponent";

const Practice: React.FunctionComponent<IPage> = props => {

    const addCharactersReference = useRef<HTMLInputElement | null>(null);
    useEffect(()=>{addCharactersReference.current?.focus();},[])

    var currentContent: FlashCard;
    const [showCharacterSRSContentElement, setShowCharacterSRSContentElement] = useState<boolean>(false)
    const [addMoreCharactersTextField, setAddMoreCharactersTextField] = useState<string>("");

    const dispatch = useDispatch();
    const {editListItemInBulk} = bindActionCreators(characterSRSactionCreators, dispatch)
    const characterSRSstate: FlashCardDeck = useSelector(
        (state: State) => state.characterSRS
    )

    const {addToPreviousCharacters, substractFromPreviousCharacters} = bindActionCreators(previousCharactersActionCreators, dispatch)
    const previousCharactersState: [FlashCard[], FlashCard[], FlashCard[]] = useSelector(
        (state: State) => state.previousCharacters
    )

    const{setShowSecondaryFlashCardInfo} = bindActionCreators(showSecondaryFlashcardInfoActionCreator, dispatch)
    const showSecondaryFlashCardInfoState: boolean = useSelector(
        (state: State) => state.showSecondaryFlashCardInfo
    )
    var showSecondaryInformationLocalState: boolean = showSecondaryFlashCardInfoState

    const todoPageContent = (): ReactElement => {
        let contentOrNotEnough;
        const srslogic: characterSRSlogic = {
            characterSRS: characterSRSstate,
            currentContent: undefined,
            mostRecentContentObjects: previousCharactersState[2],
            notEnoughCharacters: false
        }
        const srscalculationResult: characterSRSlogic = calculateNextCharacter(srslogic)
        if (srscalculationResult.notEnoughCharacters) {
            contentOrNotEnough = <p>not enough characters. add more to deck</p>
        }else {
            if (srscalculationResult.currentContent) {
                currentContent = srscalculationResult.currentContent
                contentOrNotEnough = <CardComponent content={srscalculationResult.currentContent}
                                                    show={showCharacterSRSContentElement}
                                                    showSecondary={showSecondaryInformationLocalState}/>
            }else {
                contentOrNotEnough = <p>Content type is undefined!!! this is an error</p>
            }
        }
        displayMostRecentCharacters(previousCharactersState)
        return contentOrNotEnough
    }

    const displayNumberOfCharacters = (): ReactElement => {
        const charactersYouWantToAdd: number = Number(addMoreCharactersTextField) ? Number(addMoreCharactersTextField) : 0
        const finalCharValue: number = getNewFinalCharValue(charactersYouWantToAdd)
        const allCharacters: number = characterSRSstate.cards.filter(eachContent => {
            return eachContent.repetitionValue > 0
        }).length
        return <p>highest character: {finalCharValue} all characters: {allCharacters}</p>
    }

    //used to either add new character or delete old ones (remove it from the deck)
    const addOrRemoveCardsToPractice = (charactersToAdd: number, addCards: boolean): FlashCard[] => {
        let charsToAdd: FlashCard[];
        if (addCards) {
            //add cards
            const sortedCharactersLowestToHighest: FlashCard[] = characterSRSstate.cards.sort(function sort(a: FlashCard, b: FlashCard){if (a.cardNumber < b.cardNumber) {return -1; }if (a.cardNumber > b.cardNumber) {return 1;}return 0;})
            const onlyCharactersWithReviewValueAt0: FlashCard[] = sortedCharactersLowestToHighest.filter(eachContent => eachContent.repetitionValue === 0)
            charsToAdd = onlyCharactersWithReviewValueAt0.slice(0,charactersToAdd).map(eachContent => {
                const updatedContent: FlashCard = {...eachContent, repetitionValue: 1}
                return updatedContent
            })
        }else {
            //remove cards
            const sortedCharactersHighestToLowest: FlashCard[] = characterSRSstate.cards.sort(function sortReverse(a: FlashCard, b: FlashCard){if (a.cardNumber > b.cardNumber) {return -1; }if (a.cardNumber < b.cardNumber) {return 1;}return 0;})
            const charactersWithReviewValueAbove0ReverseSorted: FlashCard[] = sortedCharactersHighestToLowest.filter(eachContent => eachContent.repetitionValue > 0)
            charsToAdd = charactersWithReviewValueAbove0ReverseSorted.slice(0,charactersToAdd).map(eachContent => {
                const updatedContent: FlashCard = {...eachContent, repetitionValue: 0}
                return updatedContent
            })
        }
        return charsToAdd
    }

    const getNewFinalCharValue = (charactersToAdd: number): number => {
        const sortedCharactersLowestToHighest: FlashCard[] = characterSRSstate.cards.sort(function sort(a: FlashCard, b: FlashCard){if (a.cardNumber < b.cardNumber) {return -1; }if (a.cardNumber > b.cardNumber) {return 1;}return 0;})
        const onlyCharactersWithReviewValueAt0: FlashCard[] = sortedCharactersLowestToHighest.filter(eachContent => eachContent.repetitionValue === 0)
        const charsToAdd: FlashCard[] = onlyCharactersWithReviewValueAt0.slice(0,charactersToAdd)
        const sortedCharsReviewValueAbove0WithNewChars: FlashCard[] = sortedCharactersLowestToHighest.filter(eachContent => eachContent.repetitionValue > 0).concat(charsToAdd)
        const sortetReverse: FlashCard[] = sortedCharsReviewValueAbove0WithNewChars.sort(function sortReverse(a: FlashCard, b: FlashCard){if (a.cardNumber > b.cardNumber) {return -1; }if (a.cardNumber < b.cardNumber) {return 1;}return 0;})
        return sortetReverse[0] ? sortetReverse[0].cardNumber : 0
    }

    const deleteANumberOfCharacters = () => {
        const charactersYouWantToAdd: number = Number(addMoreCharactersTextField) ? Number(addMoreCharactersTextField) : 0
        const charactersToDelete: FlashCard[] = addOrRemoveCardsToPractice(charactersYouWantToAdd, false)
        setAddMoreCharactersTextField("")
        editListItemInBulk(charactersToDelete, characterSRSstate)
    }
    const addANumberOfCharacters = () => {
        const charactersYouWantToAdd: number = Number(addMoreCharactersTextField) ? Number(addMoreCharactersTextField) : 0
        const newCharactersToBeAdded: FlashCard[] = addOrRemoveCardsToPractice(charactersYouWantToAdd, true)
        setAddMoreCharactersTextField("")
        editListItemInBulk(newCharactersToBeAdded, characterSRSstate)
    }
    const changeOnNewCharacterInputField = (e: React.FormEvent<HTMLInputElement>) => {
        setAddMoreCharactersTextField(e.currentTarget.value)
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key.toString() === ' ' || event.key.toString() === "ArrowRight") {
            setAddMoreCharactersTextField("")
            if (showCharacterSRSContentElement) {
                increaseReviewValueWithOne()
            }else {
                setShowCharacterSRSContentElementFunc()
            }
        }else if(event.key.toString() === "ArrowLeft"){
            setAddMoreCharactersTextField("")
            if (showCharacterSRSContentElement) {
                decreaseReviewValueWithOne()
            }else {
                setShowCharacterSRSContentElementFunc()
            }
        }
    };

    const addCharactersPageContent = (): ReactElement => {
        return <section>
            <button type="button" onClick={addANumberOfCharacters}>addNewChars</button>
            <input
                ref={addCharactersReference}
                type="text"
                onKeyDown={handleKeyDown}
                value={addMoreCharactersTextField} id="addMoreCharacters"
                placeholder="addCharacters"
                onInput={changeOnNewCharacterInputField}>
            </input>
            <button type="button" onClick={deleteANumberOfCharacters}>deleteLatestCharacters</button>
        </section>
    }

    const setShowCharacterSRSContentElementFunc = () => {
        setShowCharacterSRSContentElement(true);
    }
    const increaseReviewValueWithFive = () => {
        respondToAPresentedCharacterSRSObject(5)
    }
    const increaseReviewValueWithOne = () => {
        respondToAPresentedCharacterSRSObject(1)
    }
    const decreaseReviewValueWithFive = () => {
        respondToAPresentedCharacterSRSObject(-5)
    }
    const decreaseReviewValueWithOne = () => {
        respondToAPresentedCharacterSRSObject(-1)
    }

    const respondToAPresentedCharacterSRSObject = (increaseOrDecreaseReviewValue: number) => {
        const current: FlashCard = currentContent
        const updatedDate: string = new Date().toISOString().slice(0,10)
        const updatedReviewValue: number =
            (current && current.repetitionValue && current.repetitionValue+increaseOrDecreaseReviewValue > 0)
                ? current.repetitionValue+increaseOrDecreaseReviewValue : 1
        const updatedContent: FlashCard =
            {...current,
                repetitionValue: updatedReviewValue,
                dateOfLastReview: updatedDate,
                repetitionHistory: generateRepetitionHistoryOfLength10(current.repetitionHistory, increaseOrDecreaseReviewValue)
            }
        const updatedCharacterSRS: FlashCardDeck = {...characterSRSstate}
        setShowCharacterSRSContentElement(false)
        if (increaseOrDecreaseReviewValue > 0) {
            addToPreviousCharacters(current, previousCharactersState)
        }else if (increaseOrDecreaseReviewValue < 0) {
            substractFromPreviousCharacters(current, previousCharactersState)
        }
        editListItemInBulk([updatedContent], updatedCharacterSRS)
    }

    const generateRepetitionHistoryOfLength10 = (oldHistory: number[], increaseOrDecrease: number): number[] => {
        const basicHistory: number[] = [1,1,1,1,1,1,1,1,1,0]
        if (oldHistory == null ||
            oldHistory == undefined ||
            oldHistory.length < 10 ||
            oldHistory.length > 10) {
            return basicHistory
        }else {
            if (increaseOrDecrease > 0) {
                const removeLast: number[] = oldHistory.slice(0,oldHistory.length-1)
                const updatedList: number[] = [1].concat(removeLast)
                return updatedList
            }else if (increaseOrDecrease < 0) {
                const removeLast: number[] = oldHistory.slice(0,oldHistory.length-1)
                const updatedList: number[] = [0].concat(removeLast)
                return updatedList
            }else {
                return oldHistory
            }
        }
    }

    const buttonsToShowAndHandleCharacterSRSContentElement = (): ReactElement => {
        let buttonsToReturn: ReactElement;
        if (!showCharacterSRSContentElement) {
            buttonsToReturn =  <section>
                <button type="button" onClick={setShowCharacterSRSContentElementFunc}>showCharacter</button>
            </section>
        }else {
            buttonsToReturn = <section>
                <button id="decreaseByFive" type="button" onClick={decreaseReviewValueWithFive}>reviewValue-5</button>
                <button id="decreaseByOne" type="button" onClick={decreaseReviewValueWithOne}>reviewValue-1</button>
                <button id="increaseByOne" type="button" onClick={increaseReviewValueWithOne}>reviewValue+1</button>
                <button id="increaseByOne" type="button" onClick={increaseReviewValueWithFive}>reviewValue+5</button>
            </section>
        }
        return buttonsToReturn
    }

    const displayMostRecentCharacters = (listToDisplay: [FlashCard[], FlashCard[], FlashCard[]]): ReactElement => {
        const mostRecentCharacter: FlashCard[] = listToDisplay[2] ? listToDisplay[2] : []
        let resultString: string;
        if (!mostRecentCharacter || mostRecentCharacter.length === 0) {
            resultString = "No previous characters yet"
        }else {
            const shortList: FlashCard[] = mostRecentCharacter.length<5 ? mostRecentCharacter.reverse() : mostRecentCharacter.reverse().slice(0,5)
            const stringList: string = shortList.map(each => each.backSide+each.cardNumber).join()
            const netRepetition: number = mostRecentCharacter.length - (2 * listToDisplay[1].length)
            resultString = "previous: " + stringList +
                " total: " + mostRecentCharacter.length +
                " pos: " + listToDisplay[0].length +
                " neg: " + listToDisplay[1].length +
                " netRepetitions: " + netRepetition
        }

        const buttonsToEditRecentChars: ReactElement =
            <section>
                <button id="increaseLastCardByOne" type="button" onClick={increaseRepetitionOfLastCharacterByOne}>increaseLastCardByOne</button>
                <button id="decreaseLastCardByOne" type="button" onClick={reduceRepetitionOfLastCharacterByOne}>reduceLastCardByOne</button>
            </section>

        return <section>{resultString} {buttonsToEditRecentChars}</section>
    }

    const increaseRepetitionOfLastCharacterByOne = () => {
        editRepetitionOfLastCharacterByOne(1)
    }

    const reduceRepetitionOfLastCharacterByOne = () => {
        editRepetitionOfLastCharacterByOne(-1)
    }

    const editRepetitionOfLastCharacterByOne = (integerToAdd: number) => {
        const mostRecentCharactersList: FlashCard[] = previousCharactersState[2] ? previousCharactersState[2] : []
        if (mostRecentCharactersList && mostRecentCharactersList.length > 0){
            const recentChar: FlashCard = mostRecentCharactersList[mostRecentCharactersList.length-1]
            const recentCharReviewnumberReduced: number = recentChar.repetitionValue+integerToAdd
            const updatedChar: FlashCard = {...recentChar, repetitionValue: recentCharReviewnumberReduced}
            editListItemInBulk([updatedChar], characterSRSstate)
        }
    }

    const changeShowSecondaryInformationValue = () => {
        setShowSecondaryFlashCardInfo(!showSecondaryInformationLocalState)
    }

    const showSecondaryInformationReactElement = (): ReactElement => {
        return <section>
            <button type="button" onClick={changeShowSecondaryInformationValue}>showSecondary:{showSecondaryInformationLocalState.toString()}</button>
        </section>
    }

    return <section>
        <h1> Practice </h1>
        {displayMostRecentCharacters(previousCharactersState)}
        {displayNumberOfCharacters()}
        {addCharactersPageContent()}
        {showSecondaryInformationReactElement()}
        <p>***</p>
        {buttonsToShowAndHandleCharacterSRSContentElement()}
        <p>***</p>
        {todoPageContent()}
    </section>
};

export default Practice;