
import React, {MutableRefObject, ReactElement, useEffect, useRef, useState} from "react";
import IPage from "../interfaces/page";
import {useDispatch, useSelector} from "react-redux";
import {bindActionCreators} from "redux";
import { characterSRSactionCreators,
    previousCharactersActionCreators,
    cardDisplayActionCreator,
    State } from '../state/index';
import {FlashCard} from "../interfaces/flashcard";
import {FlashCardDeck} from "../interfaces/flashcarddeck";
import characterSRSlogic from "../interfaces/characterSRSlogic";
import {calculateNextCharacter} from "../applogic/characterSRSlogic/calculateCharacterSRSorder/characterSRSlogicBoundary";
import CardComponent from "../components/CardComponent";
import CardDisplay from "../interfaces/cardDisplay";
import {
    filterByTags,
    getSettings_filtercardsbytag,
    getSettings_filtercardsbytag_numbers
} from "../applogic/FlashcardDisplayLogic/FlashCardFiltering";

const Practice: React.FunctionComponent<IPage> = props => {

    const addCharactersReference = useRef<HTMLInputElement | null>(null);
    useEffect(()=>{addCharactersReference.current?.focus();},[])

    //the current card being looked at
    var currentContent: FlashCard;

    const previousCard: MutableRefObject<FlashCard[]> = useRef<FlashCard[]>([]);
    const [showCharacterSRSContentElement, setShowCharacterSRSContentElement] = useState<boolean>(false)
    const [showPreviusCard, setShowPreviusCard] = useState<boolean>(false)
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

    const {cardDisplayChangeState} = bindActionCreators(cardDisplayActionCreator, dispatch)
    const showCardDisplay: CardDisplay = useSelector(
        (state: State) => state.cardDisplay
    )
    var cardDisplayLocalState: CardDisplay = showCardDisplay
    const localTagsFilterNumbers: Set<number> = getSettings_filtercardsbytag_numbers(characterSRSstate)

    const previuscharacterLocalUpdate = (newChar: FlashCard | undefined): void => {
        if (newChar) {
            if (
                previousCard.current.length > 0 &&
                previousCard.current[0].cardNumber !== newChar.cardNumber
            ) {
                const updatedPrevius: FlashCard[] = [newChar, ...previousCard.current];
                previousCard.current = updatedPrevius.slice(0, 2); // Limit to 2 elements if needed
            } else if (previousCard.current.length === 0) {
                const updatedPrevius: FlashCard[] = [newChar];
                previousCard.current = updatedPrevius.slice(0, 1); // Limit to 1 element
            }
        }
    };

    const todoPageContent = (): ReactElement => {
        let contentOrNotEnough;
        //update cards to select from, by taking filtering into account
        //const localTagsFilter: Record<string, string> =
        const filteredCards: FlashCard[] = characterSRSstate.cards.filter(each => localTagsFilterNumbers.has(each.cardNumber))
        //const updatedSrs: FlashCardDeck = {...characterSRSstate}
        const updatedSrs: FlashCardDeck = {...characterSRSstate, cards: filteredCards}

        const srslogic: characterSRSlogic = {
            characterSRS: updatedSrs,
            currentContent: undefined,
            mostRecentContentObjects: previousCharactersState[2],
            notEnoughCharacters: false
        }
        const srscalculationResult: characterSRSlogic = calculateNextCharacter(srslogic)
        if (srscalculationResult.notEnoughCharacters) {

            contentOrNotEnough = <p>not enough characters. add more to deck</p>
        }else {
            if (srscalculationResult.currentContent) {
                //set global content variable
                currentContent = srscalculationResult.currentContent
                previuscharacterLocalUpdate(currentContent)
                contentOrNotEnough = generateCardComponent(
                    srscalculationResult.currentContent,
                    showCharacterSRSContentElement,
                    cardDisplayLocalState,
                    false)
            }else {
                contentOrNotEnough = <p>Content type is undefined!!! this is an error</p>
            }
        }
        displayMostRecentCharacters(previousCharactersState)
        return contentOrNotEnough
    }

    const showPreviusCharacter = (
        localpreviusCard: FlashCard[],
        localshowPreviusCard: boolean
    ): ReactElement => {
        console.log('Breakpoint hit with:', { localpreviusCard, localshowPreviusCard });

        if (localshowPreviusCard && localpreviusCard.length > 1) {
            // Access the most recent card in the array
            const mostRecentCard = localpreviusCard[1];

            if (mostRecentCard.cardNumber > 0) {

                const cardComponent = generateCardComponent(
                    mostRecentCard, // Pass the most recent card
                    showCharacterSRSContentElement,
                    cardDisplayLocalState,
                    true
                );
                return cardComponent;
            } else {
                return <p>no previus card</p>;
            }
        } else {
            return <section></section>;
        }
    };

    const generateCardComponent = (
        content: FlashCard, showSRSContent: boolean, cardDisplay: CardDisplay, alwaysShow: boolean) => {

        return <CardComponent content={content}
                       show={showSRSContent}
                       cardDisplay={cardDisplay}
                       alwaysShow={alwaysShow}/>
    }

    const displayNumberOfCharacters = (): ReactElement => {
        const charactersYouWantToAdd: number = Number(addMoreCharactersTextField) ? Number(addMoreCharactersTextField) : 0
        const finalCharValue: number = getNewFinalCharValue(charactersYouWantToAdd)
        const allCharacters: number = characterSRSstate.cards.filter(eachContent => {
            return eachContent.repetitionValue > 0
        }).length
        //return <p>highest character: {finalCharValue} all characters: {allCharacters} filtered: {localTagsFilterNumbers.size}</p>
        return (
            <section>
                highest character: {finalCharValue} -
                all characters: {allCharacters} -
                filtered: {localTagsFilterNumbers.size}
            </section>
        );
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

    const addOrRemoveCardsToPracticeFromList = (charactersToAdd: number[]): FlashCard[] => {
        let charsToAdd: FlashCard[];
        const sortedCharactersLowestToHighest: FlashCard[] = characterSRSstate.cards.sort(function sort(a: FlashCard, b: FlashCard){if (a.cardNumber < b.cardNumber) {return -1; }if (a.cardNumber > b.cardNumber) {return 1;}return 0;})
        const onlyCharactersWithReviewValueAt0: FlashCard[] = sortedCharactersLowestToHighest.filter(eachContent => eachContent.repetitionValue === 0)
        charsToAdd = onlyCharactersWithReviewValueAt0.filter(x => charactersToAdd.includes(x.cardNumber))

        let charsToAddUpdated = charsToAdd.map(eachContent => {
            const updatedContent: FlashCard = {...eachContent, repetitionValue: 1}
            return updatedContent
        })
        return charsToAddUpdated
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
        if (!isNaN(Number(addMoreCharactersTextField))) {
            const charactersYouWantToAdd: number = Number(addMoreCharactersTextField) ? Number(addMoreCharactersTextField) : 0
            const newCharactersToBeAdded: FlashCard[] = addOrRemoveCardsToPractice(charactersYouWantToAdd, true)
            setAddMoreCharactersTextField("")
            editListItemInBulk(newCharactersToBeAdded, characterSRSstate)
        } else {
            const numberli = parseNumberList(addMoreCharactersTextField)
            if (numberli.length > 0) {
                const newCharactersToBeAdded: FlashCard[] = addOrRemoveCardsToPracticeFromList(numberli)
                setAddMoreCharactersTextField("")
                editListItemInBulk(newCharactersToBeAdded, characterSRSstate)
            } else {
                setAddMoreCharactersTextField("no nums in list")
            }
        }


    }

    const parseNumberList = (input: string): number[] => {
        return (
            input
                .split(",") // Split the string by commas
                .filter(value => value.trim() !== "") // Remove empty strings and whitespace
                .map(Number) // Convert each remaining string to a number
                .filter(Number.isFinite) // Ensure the result contains only valid numbers
        );
    };

    const changeOnNewCharacterInputField = (e: React.FormEvent<HTMLInputElement>) => {
        setAddMoreCharactersTextField(e.currentTarget.value)
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        const spaceOrRightArrow: boolean = event.key.toString() === ' '
            || event.key.toString() === "ArrowRight"
            || event.key.toString() === '‘'
            || event.key.toString() === '`'

        //if the use wants to test themselves by writing the backside of the card
        if (spaceOrRightArrow
                && currentContent
                && addMoreCharactersTextField
                && addMoreCharactersTextField != " "
                && currentContent.backSide.indexOf(addMoreCharactersTextField.trim()) > -1) {
            setAddMoreCharactersTextField("")
            increaseReviewValueWithOne()
        }else if (spaceOrRightArrow) {
            //mark the card correct
            setAddMoreCharactersTextField("")
            if (showCharacterSRSContentElement) {
                increaseReviewValueWithOne()
            }else {
                setShowCharacterSRSContentElementFunc()
            }
        }else if(event.key.toString() === "ArrowLeft"){
            //mark the card incorrect
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
                onInput={changeOnNewCharacterInputField}
                autoComplete="off">
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
                repetitionHistory: generateRepetitionHistoryOfLength30(current.repetitionHistory, increaseOrDecreaseReviewValue)
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

    const generateRepetitionHistoryOfLength30 = (oldHistory: number[], increaseOrDecrease: number): number[] => {
        const basicHistory: number[] = [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0]
        if (oldHistory == null ||
            oldHistory == undefined ||
            oldHistory.length < 30 ||
            oldHistory.length > 30) {
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
                {displayMostRecentCard()}
                <button id="decreaseLastCardByOne" type="button" onClick={reduceRepetitionOfLastCharacterByOne}>reduceLastCardByOne</button>
                <button id="togglePreviusCard" type="button" onClick={toggleShowPreviousCard}>toggleShowPrevious</button>
            </section>
        return <section>{resultString} {buttonsToEditRecentChars}</section>
    }

    const toggleShowPreviousCard = () => {
        if (showPreviusCard) {
            setShowPreviusCard(false)
        }else {
            setShowPreviusCard(true)
        }
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
            const recentCharNumber: number = mostRecentCharactersList[mostRecentCharactersList.length-1].cardNumber
            const recentChar: FlashCard = characterSRSstate.cards.filter(eachCard => eachCard.cardNumber == recentCharNumber)[0]
            const recentCharReviewnumberReduced: number = recentChar.repetitionValue+integerToAdd
            if (recentCharReviewnumberReduced > 0) {
                const updatedCharacterSRS: FlashCardDeck = {...characterSRSstate}
                const updatedChar: FlashCard = {...recentChar, repetitionValue: recentCharReviewnumberReduced}
                editListItemInBulk([updatedChar], updatedCharacterSRS)
            }
        }
    }

    const displayMostRecentCard = (): string => {
        const desiredCard: FlashCard = getMostRecentCard()
        if (desiredCard.cardNumber > 0) {
            const returnString: string = desiredCard.repetitionValue + desiredCard.backSide + desiredCard.cardNumber
            return returnString
        }
        return "no cards to display"
    }

    const getMostRecentCard = (): FlashCard => {
        const mostRecentCharactersList: FlashCard[] = previousCharactersState[2] ? previousCharactersState[2] : []
        if (mostRecentCharactersList && mostRecentCharactersList.length > 0){
            const recentChar: FlashCard = mostRecentCharactersList[0]
            const recentNumber: number = recentChar.cardNumber
            const cardDeck: FlashCard[] = characterSRSstate.cards.filter(eachCard => eachCard.cardNumber == recentNumber)
            if (cardDeck.length > 0) {
                const desiredCard: FlashCard = cardDeck[0]
                return desiredCard
            }
        }
        return {... characterSRSstate.cards[0], cardNumber: 0}
    }

    const changeShowPrimaryInformationValue = () => {
        const currentValue: boolean = cardDisplayLocalState.showPrimaryCardInfo
        const updatedValue: CardDisplay = {...cardDisplayLocalState, showPrimaryCardInfo: !currentValue}
        cardDisplayChangeState(updatedValue, cardDisplayLocalState)
    }

    const changeShowSecondaryInformationValue = () => {
        const currentValue: boolean = cardDisplayLocalState.showSecondaryCardInfo
        const updatedValue: CardDisplay = {...cardDisplayLocalState, showSecondaryCardInfo: !currentValue}
        cardDisplayChangeState(updatedValue, cardDisplayLocalState)
    }

    const changeReadAloud = () => {
        const currentValue: boolean = cardDisplayLocalState.readAloud
        const updatedValue: CardDisplay = {...cardDisplayLocalState, readAloud: !currentValue}
        cardDisplayChangeState(updatedValue, cardDisplayLocalState)
    }

    const showInfoButtons = (): ReactElement => {
        return <section>
            <button type="button"
                    onClick={changeShowPrimaryInformationValue}>showPrimary:{cardDisplayLocalState.showPrimaryCardInfo.toString()}</button>
            <button type="button"
                    onClick={changeShowSecondaryInformationValue}>showSecondary:{cardDisplayLocalState.showSecondaryCardInfo.toString()}</button>
            <button type="button"
                    onClick={changeReadAloud}>readAloud:{cardDisplayLocalState.readAloud.toString()}</button>
        </section>
    }

    return <section>
        <h1> Practice </h1>
        {displayMostRecentCharacters(previousCharactersState)}
        {displayNumberOfCharacters()}
        {addCharactersPageContent()}
        {showInfoButtons()}

        {buttonsToShowAndHandleCharacterSRSContentElement()}
        <div className={showPreviusCard ? "side-by-side-container" : ""}>
            {todoPageContent()}
            {showPreviusCharacter(previousCard.current, showPreviusCard.valueOf())}
        </div>

    </section>
};

export default Practice;